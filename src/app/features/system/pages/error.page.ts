import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  template: `
    <section>
      <h2>Errore applicativo</h2>
      <p>Reason: {{ reason }}</p>
    </section>
  `,
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly reason = this.route.snapshot.queryParamMap.get('reason') ?? 'unknown';
}
