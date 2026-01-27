import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { LabelActionsT } from 'src/app/interfaces/labels';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class NavComponent implements OnInit {
  @ViewChild("modalContainer ") modalContainer !: ElementRef<HTMLInputElement>
  @ViewChild("modal") modal !: ElementRef<HTMLInputElement>
  @ViewChild("labelInput") labelInput !: ElementRef<HTMLInputElement>
  @ViewChild("labelError") labelError !: ElementRef<HTMLInputElement>

  constructor(public Shared: SharedService, public router: Router) { }

  // ? modal ----------------------------------------------------------
  openModal() {
    this.modalContainer.nativeElement.style.display = 'block';
    document.addEventListener('mousedown', this.mouseDownEvent)
  }
  hideModal() {
    this.modalContainer.nativeElement.style.display = 'none'
    document.removeEventListener('mousedown', this.mouseDownEvent)
  }
  mouseDownEvent = (event: Event) => {
    let modalEl = this.modal.nativeElement
    if (!(modalEl as any).contains(event.target)) {
      this.hideModal()
    }
  }

  // ? labels ----------------------------------------------------

  addLabel(el: HTMLInputElement) {
    if (!el) return
    this.Shared.label.db.add({ name: el.value })
      .then(() => { this.labelError.nativeElement.hidden = true; el.value = ''; el.focus() })
      .catch(x => { if (x.name === "ConstraintError") this.labelError.nativeElement.hidden = false; el.focus() })
  }

  editLabel(id: string) {
    this.Shared.label.id = id
    let actions: LabelActionsT = {
      delete: () => {
        this.Shared.label.db.delete()
        this.Shared.label.db.updateAllLabels('')
      },
      update: (value: string) => {
        this.Shared.label.db.update({ name: value })
        this.Shared.label.db.updateAllLabels(value)
      }
    }
    return actions
  }

  // ? label colors ----------------------------------------------------
  labelColors = [
    '#5f6368', // Gray (default)
    '#d93025', // Red
    '#fa903e', // Orange
    '#f9ab00', // Yellow
    '#188038', // Green
    '#007b83', // Teal
    '#1a73e8', // Blue
    '#9334e6', // Purple
    '#e52592', // Pink
  ]

  colorPickerOpen: string | null = null

  toggleColorPicker(label: any) {
    if (this.colorPickerOpen === label.id) {
      this.colorPickerOpen = null
    } else {
      this.colorPickerOpen = label.id
    }
  }

  setLabelColor(label: any, color: string) {
    this.Shared.label.id = label.id
    this.Shared.label.db.update({ color: color })
    label.color = color
    this.colorPickerOpen = null
  }


  collapseSideBar() {
    document.querySelector('[sideBar]')?.classList.toggle('close')
  }


  ngOnInit(): void {
    this.Shared.closeSideBar.subscribe(x => { if (x) this.collapseSideBar() })
    if (window.innerWidth <= 600) {
      this.collapseSideBar()
    }
  }


}
