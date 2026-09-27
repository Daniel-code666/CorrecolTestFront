import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
import { ClientService } from "./client.service";
import {
  Client,
  ClientWrite,
  IdentificationType,
  identificationTypes,
} from "./client.models";
import { CatalogItem, CatalogService } from "../catalogos/catalog.service";
import { errorMessage } from "../../core/api";
import { ModalDirective } from "../../core/modal.directive";
@Component({
  selector: "app-client-form",
  imports: [ReactiveFormsModule, ModalDirective],
  templateUrl: "./client-form.html",
})
export class ClientForm implements OnInit {
  readonly id = input<number | null>(null);
  readonly saved = output<Client>();
  readonly closed = output<void>();
  private api = inject(ClientService);
  private catalogs = inject(CatalogService);
  private destroy = inject(DestroyRef);
  readonly types = identificationTypes;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly geoError = signal("");
  readonly loadingDepartments = signal(false);
  readonly loadingCities = signal(false);
  readonly inactive = signal(false);
  readonly initialized = signal(false);
  readonly countries = signal<CatalogItem[]>([]);
  readonly departments = signal<CatalogItem[]>([]);
  readonly cities = signal<CatalogItem[]>([]);
  private countryVersion = 0;
  private cityVersion = 0;
  form = new FormGroup({
    tipoIdentificacion: new FormControl<IdentificationType>(
      "CedulaCiudadania",
      { nonNullable: true, validators: [Validators.required] },
    ),
    numeroIdentificacion: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(/\S/),
      ],
    }),
    razonSocial: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        Validators.pattern(/\S/),
      ],
    }),
    paisCodigo: new FormControl<number | null>(null, Validators.required),
    departamentoCodigo: new FormControl<number | null>({
      value: null,
      disabled: true,
    }),
    ciudadCodigo: new FormControl<number | null>({
      value: null,
      disabled: true,
    }),
  });
  constructor() {
    this.form.controls.paisCodigo.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => void this.countryChanged(value));
    this.form.controls.departamentoCodigo.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => void this.departmentChanged(value));
  }
  ngOnInit() {
    void this.initialize();
  }
  private async read<T>(source: import("rxjs").Observable<T>) {
    return firstValueFrom(source.pipe(takeUntilDestroyed(this.destroy)));
  }
  async initialize() {
    this.loading.set(true);
    this.initialized.set(false);
    this.error.set("");
    try {
      this.countries.set(await this.read(this.catalogs.countries()));
      const id = this.id();
      if (id !== null) {
        const client = await this.read(this.api.get(id));
        this.inactive.set(!client.active);
        this.form.patchValue(client, { emitEvent: false });
        await this.countryChanged(
          client.paisCodigo,
          client.departamentoCodigo,
          client.ciudadCodigo,
        );
        if (!client.active) this.form.disable({ emitEvent: false });
      }
      this.initialized.set(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  async countryChanged(
    country: number | null,
    department: number | null = null,
    city: number | null = null,
  ) {
    const version = ++this.countryVersion;
    ++this.cityVersion;
    this.loadingCities.set(false);
    this.geoError.set("");
    this.departments.set([]);
    this.cities.set([]);
    const controls = this.form.controls;
    controls.departamentoCodigo.reset(null, { emitEvent: false });
    controls.departamentoCodigo.disable({ emitEvent: false });
    controls.ciudadCodigo.reset(null, { emitEvent: false });
    controls.ciudadCodigo.disable({ emitEvent: false });
    if (!country) {
      this.loadingDepartments.set(false);
      return;
    }
    this.loadingDepartments.set(true);
    try {
      const items = await this.read(this.catalogs.departments(country));
      if (version !== this.countryVersion) return;
      this.departments.set(items);
      controls.departamentoCodigo.setValidators(
        items.length ? Validators.required : null,
      );
      if (items.length)
        controls.departamentoCodigo.enable({ emitEvent: false });
      controls.departamentoCodigo.setValue(department, { emitEvent: false });
      if (department) await this.departmentChanged(department, city);
    } catch (e) {
      if (version === this.countryVersion) this.geoError.set(errorMessage(e));
    } finally {
      if (version === this.countryVersion) this.loadingDepartments.set(false);
    }
  }
  async departmentChanged(
    department: number | null,
    city: number | null = null,
  ) {
    const version = ++this.cityVersion;
    this.geoError.set("");
    this.cities.set([]);
    const control = this.form.controls.ciudadCodigo;
    control.reset(null, { emitEvent: false });
    control.disable({ emitEvent: false });
    if (!department) {
      this.loadingCities.set(false);
      return;
    }
    this.loadingCities.set(true);
    try {
      const items = await this.read(this.catalogs.cities(department));
      if (version !== this.cityVersion) return;
      this.cities.set(items);
      control.setValidators(items.length ? Validators.required : null);
      if (items.length) control.enable({ emitEvent: false });
      control.setValue(city, { emitEvent: false });
    } catch (e) {
      if (version === this.cityVersion) this.geoError.set(errorMessage(e));
    } finally {
      if (version === this.cityVersion) this.loadingCities.set(false);
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
      this.form.invalid ||
      !this.initialized() ||
      this.loading() ||
      this.saving() ||
      this.loadingDepartments() ||
      this.loadingCities() ||
      this.geoError() ||
      this.inactive()
    )
      return;
    this.saving.set(true);
    this.error.set("");
    const raw = this.form.getRawValue();
    const data: ClientWrite = {
      ...raw,
      paisCodigo: raw.paisCodigo!,
      numeroIdentificacion: raw.numeroIdentificacion.trim(),
      razonSocial: raw.razonSocial.trim(),
    };
    try {
      const id = this.id();
      const result = await this.read(
        id !== null ? this.api.update(id, data) : this.api.create(data),
      );
      this.saved.emit(result);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
