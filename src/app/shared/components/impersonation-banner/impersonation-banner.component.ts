import { Component, input } from '@angular/core';

@Component({
  selector: 'app-impersonation-banner',
  standalone: true,
  templateUrl: './impersonation-banner.component.html',
  styleUrl: './impersonation-banner.component.css',
})
export class ImpersonationBannerComponent {
  readonly active = input<boolean>(false);
  readonly impersonatedUserId = input<string | null>(null);
}
