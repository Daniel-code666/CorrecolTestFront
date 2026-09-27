import { Component, DestroyRef, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ModalDirective } from "../../core/modal.directive";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subject, startWith, switchMap, catchError, of } from "rxjs";
import { ClientService, ClientFilters } from "./client.service";
import { Client, identificationTypes, typeLabel } from "./client.models";
import { errorMessage } from "../../core/api";
import { ClientForm } from "./client-form";
@Component({
  selector: "app-client-list",
  imports: [ReactiveFormsModule, ModalDirective, ClientForm],
  templateUrl: "./client-list.html",
})
export class ClientList {
  private api = inject(ClientService);
  private destroy = inject(DestroyRef);
  private refresh = new Subject<void>();
  readonly types = identificationTypes;
  readonly typeLabel = typeLabel;
  readonly clients = signal<Client[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly listFailed = signal(false);
  readonly notice = signal("");
  readonly exporting = signal(false);
  readonly deactivating = signal(false);
  readonly selected = signal<Client | null>(null);
  readonly editing = signal<{ id: number | null } | null>(null);
  page = 1;
  pageSize = 10;
  filters = new FormGroup({
    numeroIdentificacion: new FormControl("", { nonNullable: true }),
    razonSocial: new FormControl("", { nonNullable: true }),
    tipoIdentificacion: new FormControl("", { nonNullable: true }),
    active: new FormControl("true", { nonNullable: true }),
  });
  private applied: ClientFilters = { active: "true" };
  constructor() {
    this.refresh
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading.set(true);
          this.error.set("");
          this.listFailed.set(false);
          return this.api
            .list({
              ...this.applied,
              pageNumber: this.page,
              pageSize: this.pageSize,
            })
            .pipe(
              catchError((e) => {
                this.error.set(errorMessage(e));
                this.listFailed.set(true);
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result) {
          this.clients.set(result.items);
          this.total.set(result.totalRecords);
          if (!result.items.length && this.page > 1) {
            this.page--;
            this.refresh.next();
          }
        }
      });
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
  search() {
    const f = this.filters.getRawValue();
    this.applied = {
      active: f.active,
      numeroIdentificacion: f.numeroIdentificacion.trim() || undefined,
      razonSocial: f.razonSocial.trim() || undefined,
      tipoIdentificacion: f.tipoIdentificacion || undefined,
    };
    this.page = 1;
    this.refresh.next();
  }
  clear() {
    this.filters.reset();
    this.search();
  }
  changePage(page: number) {
    this.page = page;
    this.refresh.next();
  }
  changePageSize(value: string) {
    const size = Number(value);
    if (![10, 20, 30].includes(size) || size === this.pageSize) return;
    this.pageSize = size;
    this.page = 1;
    this.refresh.next();
  }
  retry() {
    this.refresh.next();
  }
  export() {
    this.exporting.set(true);
    this.error.set("");
    this.api
      .export(this.applied)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "clientes.xlsx";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.exporting.set(false);
        },
        error: (e) => {
          this.exporting.set(false);
          this.error.set(errorMessage(e));
        },
      });
  }
  deactivate() {
    const client = this.selected();
    if (!client || this.deactivating()) return;
    this.deactivating.set(true);
    this.api
      .deactivate(client.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.deactivating.set(false);
          this.selected.set(null);
          this.notice.set("El cliente fue desactivado correctamente.");
          this.refresh.next();
        },
        error: (e) => {
          this.deactivating.set(false);
          this.selected.set(null);
          this.error.set(errorMessage(e));
        },
      });
  }
  onSaved() {
    const updated = this.editing()?.id !== null;
    this.editing.set(null);
    this.notice.set(
      `Cliente ${updated ? "actualizado" : "creado"} correctamente.`,
    );
    this.refresh.next();
  }
}
