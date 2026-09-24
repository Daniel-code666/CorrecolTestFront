import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import {
  CatalogCreate,
  CatalogItem,
  CatalogResource,
  CatalogService,
  CatalogUpdate,
} from "./catalog.service";
import { ModalDirective } from "../../core/modal.directive";
import { errorMessage } from "../../core/api";

const singular: Record<CatalogResource, string> = {
  paises: "país",
  departamentos: "departamento",
  ciudades: "ciudad",
};
const requiredText = (max: number) => [
  Validators.required,
  Validators.maxLength(max),
  Validators.pattern(/\S/),
];

@Component({
  selector: "app-catalog-form",
  imports: [ReactiveFormsModule, ModalDirective, DatePipe],
  templateUrl: "./catalog-form.html",
})
export class CatalogForm implements OnInit {
  readonly resource = input.required<CatalogResource>();
  readonly code = input<number | null>(null);
  readonly saved = output<CatalogItem>();
  readonly closed = output<void>();
  private api = inject(CatalogService);
  private destroy = inject(DestroyRef);
  readonly loading = signal(true);
  readonly initialized = signal(false);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly item = signal<CatalogItem | null>(null);
  readonly countries = signal<CatalogItem[]>([]);
  readonly departments = signal<CatalogItem[]>([]);
  readonly selectedCountry = signal<number | null>(null);
  form = new FormGroup({
    codigo: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/),
    ]),
    nombre: new FormControl("", {
      nonNullable: true,
      validators: requiredText(100),
    }),
    iso1: new FormControl("", { nonNullable: true }),
    iso2: new FormControl("", { nonNullable: true }),
    capital: new FormControl("", { nonNullable: true }),
    paisCodigo: new FormControl<number | null>(null),
    departamentoCodigo: new FormControl<number | null>(null),
  });
  get noun() {
    return singular[this.resource()];
  }
  get readonly() {
    return this.item()?.active === false;
  }
  get title() {
    return `${this.readonly ? "Consultar" : this.code() !== null ? "Editar" : "Crear"} ${this.noun}`;
  }
  get maxCode() {
    return this.resource() === "paises" ? 32767 : 2147483647;
  }
  get availableDepartments() {
    return this.departments().filter(
      (d) => d.paisCodigo === this.selectedCountry(),
    );
  }
  constructor() {
    this.form.controls.paisCodigo.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.selectedCountry.set(value);
        const control = this.form.controls.departamentoCodigo;
        control.reset(null, { emitEvent: false });
        if (value) control.enable({ emitEvent: false });
        else control.disable({ emitEvent: false });
      });
  }
  ngOnInit() {
    void this.initialize();
  }
  private read<T>(request: import("rxjs").Observable<T>) {
    return firstValueFrom(request.pipe(takeUntilDestroyed(this.destroy)));
  }
  async initialize() {
    this.loading.set(true);
    this.initialized.set(false);
    this.error.set("");
    const controls = this.form.controls;
    controls.codigo.addValidators(Validators.max(this.maxCode));
    if (this.resource() === "paises") {
      controls.iso1.setValidators(requiredText(5));
      controls.iso2.setValidators(requiredText(3));
      controls.capital.setValidators(requiredText(100));
    } else {
      controls.paisCodigo.setValidators(Validators.required);
      if (this.resource() === "ciudades") {
        controls.departamentoCodigo.setValidators(Validators.required);
        controls.departamentoCodigo.disable({ emitEvent: false });
      }
    }
    try {
      const code = this.code();
      if (code !== null) {
        const item = await this.read(this.api.get(this.resource(), code));
        this.item.set(item);
        this.form.patchValue(item, { emitEvent: false });
        this.selectedCountry.set(item.paisCodigo ?? null);
        if (this.resource() !== "paises" && item.paisCodigo)
          this.countries.set([
            await this.read(this.api.get("paises", item.paisCodigo)),
          ]);
        if (this.resource() === "ciudades" && item.departamentoCodigo)
          this.departments.set([
            await this.read(
              this.api.get("departamentos", item.departamentoCodigo),
            ),
          ]);
        controls.codigo.disable({ emitEvent: false });
        controls.paisCodigo.disable({ emitEvent: false });
        controls.departamentoCodigo.disable({ emitEvent: false });
        if (!item.active) this.form.disable({ emitEvent: false });
      } else if (this.resource() !== "paises") {
        this.countries.set(await this.read(this.api.countries()));
        if (this.resource() === "ciudades")
          this.departments.set(await this.read(this.api.departments()));
      }
      Object.values(controls).forEach((control) =>
        control.updateValueAndValidity({ emitEvent: false }),
      );
      this.initialized.set(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  invalid(name: keyof typeof this.form.controls) {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }
  close() {
    if (!this.saving()) this.closed.emit();
  }
  cancel(event: Event) {
    event.preventDefault();
    this.close();
  }
  async save() {
    this.form.markAllAsTouched();
    if (
      !this.initialized() ||
      this.loading() ||
      this.saving() ||
      this.readonly ||
      this.form.invalid
    )
      return;
    this.saving.set(true);
    this.error.set("");
    const raw = this.form.getRawValue();
    const code = this.code();
    const update: CatalogUpdate =
      this.resource() === "paises"
        ? {
            nombre: raw.nombre.trim(),
            iso1: raw.iso1.trim().toUpperCase(),
            iso2: raw.iso2.trim().toUpperCase(),
            capital: raw.capital.trim(),
          }
        : { nombre: raw.nombre.trim() };
    try {
      let result: CatalogItem;
      if (code !== null)
        result = await this.read(
          this.api.update(this.resource(), code, update),
        );
      else {
        const create: CatalogCreate =
          this.resource() === "paises"
            ? ({ ...update, codigo: raw.codigo! } as CatalogCreate)
            : this.resource() === "departamentos"
              ? {
                  nombre: raw.nombre.trim(),
                  codigo: raw.codigo!,
                  paisCodigo: raw.paisCodigo!,
                }
              : {
                  nombre: raw.nombre.trim(),
                  codigo: raw.codigo!,
                  departamentoCodigo: raw.departamentoCodigo!,
                };
        result = await this.read(this.api.create(this.resource(), create));
      }
      this.saved.emit(result);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
