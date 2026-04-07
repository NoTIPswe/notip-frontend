import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ObfuscatedGateway } from '../../../../core/models/gateway';
import { AdminGatewayTableComponent } from './admin-gateway-table.component';

describe('AdminGatewayTableComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AdminGatewayTableComponent>>;

  const gateways: ObfuscatedGateway[] = [
    {
      gatewayId: 'gw-1',
      tenantId: 'tenant-1',
      model: 'model-a',
      firmware: '1.0.0',
      provisioned: true,
      factoryId: 'factory-1',
      createdAt: '2026-04-07T10:15:30.000Z',
    },
    {
      gatewayId: 'gw-2',
      tenantId: 'tenant-2',
      model: 'model-b',
      provisioned: false,
      factoryId: 'factory-2',
      createdAt: '2026-04-07T11:15:30.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGatewayTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminGatewayTableComponent);
  });

  it('shows loading status while loading', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const status = (fixture.nativeElement as HTMLElement).querySelector('.status');
    expect(status?.textContent).toContain('Loading...');
  });

  it('shows empty state when no gateways are available', () => {
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('gateways', []);
    fixture.detectChanges();

    const empty = (fixture.nativeElement as HTMLElement).querySelector('.empty');
    expect(empty?.textContent).toContain('No gateways available.');
  });

  it('renders gateway rows and fallback values', () => {
    fixture.componentRef.setInput('gateways', gateways);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('gw-1');
    expect(rows[0].textContent).toContain('yes');
    expect(rows[1].textContent).toContain('gw-2');
    expect(rows[1].textContent).toContain('no');
    expect(rows[1].textContent).toContain('-');
  });
});
