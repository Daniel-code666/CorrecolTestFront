import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
@Component({
  selector: "app-root",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: ` <a href="#main" class="visually-hidden-focusable skip-link"
      >Ir al contenido</a
    >
    <header class="app-header">
      <div class="container-fluid shell header-inner">
        <a routerLink="/clientes" class="brand" aria-label="Correcol, inicio"
          ><span class="brand-mark">c<span>•</span></span
          ><span>CORRECOL<small>Gestión de clientes</small></span></a
        ><span class="header-caption">Portal administrativo</span>
      </div>
    </header>
    <div class="workspace shell">
      <aside class="sidebar">
        <span class="nav-caption">ADMINISTRACIÓN</span>
        <nav aria-label="Menú principal">
          <a
            routerLink="/clientes"
            class="nav-item"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            ><span aria-hidden="true">▦</span> Clientes
            <span class="nav-arrow" aria-hidden="true">›</span></a
          >
          <a
            routerLink="/paises"
            class="nav-item"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            ><span aria-hidden="true">◎</span> Países</a
          >
          <a
            routerLink="/departamentos"
            class="nav-item"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            ><span aria-hidden="true">▧</span> Departamentos</a
          >
          <a
            routerLink="/ciudades"
            class="nav-item"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            ><span aria-hidden="true">⌂</span> Ciudades</a
          >
        </nav>
        <div class="sidebar-note">
          <span class="status-dot"></span>Información centralizada<small
            >Gestiona tus clientes en un solo lugar.</small
          >
        </div>
      </aside>
      <main id="main" class="main-content"><router-outlet /></main>
    </div>
    <footer class="shell app-footer">
      Correcol <span>Gestión de clientes</span>
    </footer>`,
})
export class App {}
