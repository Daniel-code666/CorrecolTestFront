import { Component, DestroyRef, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  catchError,
  combineLatest,
  forkJoin,
  of,
  Subject,
  switchMap,
} from "rxjs";
import {
  CatalogItem,
  CatalogResource,
  CatalogService,
} from "./catalog.service";
import { errorMessage } from "../../core/api";
import { CatalogForm } from "./catalog-form";
import { ModalDirective } from "../../core/modal.directive";

const titles: Record<CatalogResource, string> = {
  paises: "Países",
  departamentos: "Departamentos",
  ciudades: "Ciudades",
};

@Component({
  selector: "app-catalog-list",
  imports: [ReactiveFormsModule, RouterLink, CatalogForm, ModalDirective],
  templateUrl: "./catalog-list.html",
})
export class CatalogList {
  private service = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  private refresh = new Subject<void>();
  readonly resource = signal<CatalogResource>("paises");
  readonly rows = signal<CatalogItem[]>([]);
  readonly countries = signal<CatalogItem[]>([]);
  readonly departments = signal<CatalogItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly notice = signal("");
  readonly editing = signal<{ code: number | null } | null>(null);
  readonly deleting = signal<CatalogItem | null>(null);
  readonly deletingBusy = signal(false);
  readonly deleteError = signal("");
  readonly lookupError = signal("");
  readonly total = signal(0);
  readonly selectedCountry = signal<number | null>(null);
  page = 1;
  pageSize = 20;
  filters = new FormGroup({
    codigo: new FormControl<number | null>(null, [
      Validators.min(1),
      Validators.max(2147483647),
      Validators.pattern(/^\d+$/),
    ]),
    nombre: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    paisCodigo: new FormControl<number | null>(null),
    departamentoCodigo: new FormControl<number | null>(null),
    active: new FormControl("true", { nonNullable: true }),
  });
  private applied: Record<string, string | number | null | undefined> = {};
  get title() {
    return titles[this.resource()];
  }
  get createLabel() {
    return this.resource() === "paises"
      ? "Nuevo país"
      : this.resource() === "departamentos"
        ? "Nuevo departamento"
        : "Nueva ciudad";
  }
  get pages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }
  get first() {
    return this.total() ? (this.page - 1) * this.pageSize + 1 : 0;
  }
  get last() {
    return Math.min(this.page * this.pageSize, this.total());
  }
  get availableDepartments() {
    return this.departments().filter(
      (d) => !this.selectedCountry() || d.paisCodigo === this.selectedCountry(),
    );
  }
  constructor() {
    this.refresh
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.error.set("");
          return this.service
            .list(this.resource(), {
              ...this.applied,
              pageNumber: this.page,
              pageSize: this.pageSize,
            })
            .pipe(
              catchError((e) => {
                this.error.set(errorMessage(e));
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        this.rows.set(result?.items ?? []);
        this.total.set(result?.totalRecords ?? 0);
        if (result && !result.items.length && this.page > 1) {
          this.page = Math.max(
            1,
            Math.ceil(result.totalRecords / this.pageSize),
          );
          this.refresh.next();
        }
      });
    this.filters.controls.paisCodigo.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.selectedCountry.set(value);
        this.filters.controls.departamentoCodigo.setValue(null);
      });
    combineLatest([this.route.data, this.route.queryParamMap])
      .pipe(takeUntilDestroyed())
      .subscribe(([data, query]) => {
        this.resource.set(data["resource"] as CatalogResource);
        this.editing.set(null);
        this.deleting.set(null);
        this.notice.set("");
        const code = (name: string) => {
          const value = Number(query.get(name));
          return Number.isInteger(value) && value > 0 ? value : null;
        };
        this.filters.reset(
          {
            codigo: null,
            nombre: "",
            paisCodigo: code("paisCodigo"),
            departamentoCodigo: code("departamentoCodigo"),
            active: "true",
          },
          { emitEvent: false },
        );
        this.selectedCountry.set(this.filters.controls.paisCodigo.value);
        this.search();
      });
    this.loadLookups();
  }
  loadLookups() {
    this.lookupError.set("");
    forkJoin({
      countries: this.service.countries(true),
      departments: this.service.departments(undefined, true),
    })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (result) => {
          this.countries.set(result.countries);
          this.departments.set(result.departments);
        },
        error: (e) => this.lookupError.set(errorMessage(e)),
      });
  }
  search() {
    this.filters.markAllAsTouched();
    if (this.filters.invalid) return;
    const f = this.filters.getRawValue();
    this.applied = {
      active: f.active,
      codigo: f.codigo,
      nombre: f.nombre.trim() || undefined,
      paisCodigo: this.resource() !== "paises" ? f.paisCodigo : undefined,
      departamentoCodigo:
        this.resource() === "ciudades" ? f.departamentoCodigo : undefined,
    };
    this.page = 1;
    this.refresh.next();
  }
  clear() {
    this.filters.reset();
    this.search();
  }
  retry() {
    this.refresh.next();
  }
  changePage(page: number) {
    this.page = page;
    this.refresh.next();
  }
  changePageSize(value: string) {
    const size = Number(value);
    if (![10, 20, 30].includes(size)) return;
    this.pageSize = size;
    this.page = 1;
    this.refresh.next();
  }
  onSaved(item: CatalogItem) {
    this.editing.set(null);
    this.notice.set(`Se guardó ${item.nombre} correctamente.`);
    this.refresh.next();
    this.loadLookups();
  }
  confirmDelete(item: CatalogItem) {
    this.deleteError.set("");
    this.deleting.set(item);
  }
  closeDelete(event?: Event) {
    event?.preventDefault();
    if (!this.deletingBusy()) this.deleting.set(null);
  }
  deactivate() {
    const item = this.deleting();
    if (!item || this.deletingBusy()) return;
    this.deletingBusy.set(true);
    this.deleteError.set("");
    this.service
      .deactivate(this.resource(), item.codigo)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.deletingBusy.set(false);
          this.deleting.set(null);
          this.notice.set(`Se desactivó ${item.nombre} correctamente.`);
          this.refresh.next();
          this.loadLookups();
        },
        error: (e) => {
          this.deletingBusy.set(false);
          this.deleteError.set(errorMessage(e));
        },
      });
  }
  countryName(code?: number) {
    return (
      this.countries().find((item) => item.codigo === code)?.nombre ??
      (code ? `País ${code}` : "—")
    );
  }
  departmentName(code?: number) {
    return (
      this.departments().find((item) => item.codigo === code)?.nombre ??
      (code ? `Departamento ${code}` : "—")
    );
  }
}
