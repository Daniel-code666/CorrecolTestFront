import { AfterViewInit, Directive, ElementRef, inject } from "@angular/core";
@Directive({ selector: "dialog[appModal]" })
export class ModalDirective implements AfterViewInit {
  private element = inject<ElementRef<HTMLDialogElement>>(ElementRef);
  ngAfterViewInit() {
    this.element.nativeElement.showModal();
  }
}
