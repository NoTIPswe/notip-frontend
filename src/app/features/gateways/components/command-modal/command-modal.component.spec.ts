import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CmdGatewayStatus } from '../../../../core/models/enums';
import { CommandModalComponent } from './command-modal.component';

describe('CommandModalComponent', () => {
  let component: CommandModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandModalComponent],
    }).compileComponents();

    component = TestBed.createComponent(CommandModalComponent).componentInstance;
  });

  it('emits close event', () => {
    const emitSpy = vi.spyOn(component.closed, 'emit');

    component.close();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('emits config payload with frequency and status', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.configSubmitted, 'emit');

    component.submitConfig(event, '2000', 'online');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      send_frequency_ms: 2000,
      status: CmdGatewayStatus.online,
    });
  });

  it('emits partial config payload when only status is valid', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.configSubmitted, 'emit');

    component.submitConfig(event, 'not-number', 'paused');

    expect(emitSpy).toHaveBeenCalledWith({
      status: CmdGatewayStatus.paused,
    });
  });

  it('emits partial config payload when status is left unchanged', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.configSubmitted, 'emit');

    component.submitConfig(event, '2500', '');

    expect(emitSpy).toHaveBeenCalledWith({
      send_frequency_ms: 2500,
    });
  });

  it('emits empty config payload when all config fields are invalid', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.configSubmitted, 'emit');

    component.submitConfig(event, 'not-number', 'invalid-status');

    expect(emitSpy).toHaveBeenCalledWith({});
  });

  it('emits trimmed firmware payload', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.firmwareSubmitted, 'emit');

    component.submitFirmware(event, ' v2.0.1 ', ' https://example.test/fw.bin ');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      firmware_version: 'v2.0.1',
      download_url: 'https://example.test/fw.bin',
    });
  });
});
