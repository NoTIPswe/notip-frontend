import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Gateway } from '../../../../core/models/gateway';
import { GatewayCardComponent } from './gateway-card.component';

describe('GatewayCardComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<GatewayCardComponent>>;
  let component: GatewayCardComponent;

  const gateway: Gateway = {
    gatewayId: 'gw-1',
    name: 'Gateway 1',
    status: 'online',
    provisioned: true,
    sendFrequencyMs: 1000,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GatewayCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GatewayCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('gateway', gateway);
    fixture.detectChanges();
  });

  it('emits selected gateway id on detail open', () => {
    const emitSpy = vi.spyOn(component.selectedGateway, 'emit');

    component.onOpenDetail();

    expect(emitSpy).toHaveBeenCalledWith('gw-1');
  });
});
