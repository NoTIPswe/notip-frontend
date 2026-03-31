import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  templateUrl: './error.page.html',
  styleUrl: './error.page.css',
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly reason = this.route.snapshot.queryParamMap.get('reason') ?? 'unknown';
}
