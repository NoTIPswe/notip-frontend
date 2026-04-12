import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CmdGatewayStatus,
  CommandStatus,
  CommandStatusUpdate,
} from '../../../../core/models/command';
import { GatewayStatus, UserRole } from '../../../../core/models/enums';
import { AuthService } from '../../../../core/services/auth.service';
import { ObfuscatedMeasureService } from '../../../dashboard/services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../../dashboard/services/validated-measure-facade.service';
import { SensorService } from '../../../sensors/services/sensor.service';
import { CommandService } from '../../services/command.service';
import { GatewayService } from '../../services/gateway.service';
import { GatewayDetailPageComponent } from './gateway-detail.page';

describe('GatewayDetailPageComponent', () => {
  const routeMock = {
    paramMap: of(convertToParamMap({ id: 'gw-1' })),
  };

  const routerMock = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  const authServiceMock = {
    getRole: vi.fn(() => UserRole.tenant_admin),
    isImpersonating: vi.fn(() => false),
  };

  const gatewayServiceMock = {
    isLoading: vi.fn(() => () => false),
    getGatewayDetail: vi.fn(),
    updateGatewayName: vi.fn(),
    deleteGateway: vi.fn(),
  };

  const commandServiceMock = {
    sendConfig: vi.fn(),
    sendFirmware: vi.fn(),
  };

  const sensorServiceMock = {
    getGatewaySensors: vi.fn(),
  };

  const obfuscatedMeasureServiceMock = {
    openStream: vi.fn(),
    closeStream: vi.fn(),
  };

  const validatedMeasureFacadeServiceMock = {
    openStream: vi.fn(),
    closeStream: vi.fn(),
  };

  beforeEach(async () => {
    routerMock.navigate.mockReset();

    authServiceMock.getRole.mockReset();
    authServiceMock.getRole.mockReturnValue(UserRole.tenant_admin);
    authServiceMock.isImpersonating.mockReset();
    authServiceMock.isImpersonating.mockReturnValue(false);

    gatewayServiceMock.isLoading.mockReset();
    gatewayServiceMock.isLoading.mockReturnValue(() => false);
    gatewayServiceMock.getGatewayDetail.mockReset();
    gatewayServiceMock.getGatewayDetail.mockReturnValue(
      of({
        gatewayId: 'gw-1',
        name: 'Gateway 1',
        status: GatewayStatus.online,
        provisioned: true,
        sendFrequencyMs: 1000,
      }),
    );
    gatewayServiceMock.updateGatewayName.mockReset();
    gatewayServiceMock.deleteGateway.mockReset();

    commandServiceMock.sendConfig.mockReset();
    commandServiceMock.sendFirmware.mockReset();

    sensorServiceMock.getGatewaySensors.mockReset();

    obfuscatedMeasureServiceMock.openStream.mockReset();
    obfuscatedMeasureServiceMock.closeStream.mockReset();

    validatedMeasureFacadeServiceMock.openStream.mockReset();
    validatedMeasureFacadeServiceMock.closeStream.mockReset();

    await TestBed.configureTestingModule({
      imports: [GatewayDetailPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: GatewayService, useValue: gatewayServiceMock },
        { provide: CommandService, useValue: commandServiceMock },
        { provide: SensorService, useValue: sensorServiceMock },
        { provide: ObfuscatedMeasureService, useValue: obfuscatedMeasureServiceMock },
        { provide: ValidatedMeasureFacadeService, useValue: validatedMeasureFacadeServiceMock },
      ],
    }).compileComponents();
  });

  it('closes command modal immediately after submitting config command', () => {
    const updates$ = new Subject<CommandStatusUpdate>();
    commandServiceMock.sendConfig.mockReturnValue(updates$.asObservable());

    const component = TestBed.createComponent(GatewayDetailPageComponent).componentInstance;
    component.gatewayId.set('gw-1');
    component.commandModalMode.set('config');
    component.commandModalOpen.set(true);

    component.submitConfigCommand({ status: CmdGatewayStatus.online });

    expect(component.commandModalOpen()).toBe(false);
    expect(component.commandModalMode()).toBeNull();
    expect(commandServiceMock.sendConfig).toHaveBeenCalledWith('gw-1', {
      status: CmdGatewayStatus.online,
    });

    updates$.next({ commandId: 'cmd-1', status: CommandStatus.queued });

    expect(component.commandStatus()).toEqual({
      commandId: 'cmd-1',
      status: CommandStatus.queued,
    });
  });

  it('closes command modal immediately after submitting firmware command', () => {
    const updates$ = new Subject<CommandStatusUpdate>();
    commandServiceMock.sendFirmware.mockReturnValue(updates$.asObservable());

    const component = TestBed.createComponent(GatewayDetailPageComponent).componentInstance;
    component.gatewayId.set('gw-1');
    component.commandModalMode.set('firmware');
    component.commandModalOpen.set(true);

    component.submitFirmwareCommand({
      firmware_version: 'v2.1.0',
      download_url: 'https://example.test/fw.bin',
    });

    expect(component.commandModalOpen()).toBe(false);
    expect(component.commandModalMode()).toBeNull();
    expect(commandServiceMock.sendFirmware).toHaveBeenCalledWith('gw-1', {
      firmware_version: 'v2.1.0',
      download_url: 'https://example.test/fw.bin',
    });
  });

  it('does not clear global busy flag when command status updates arrive', () => {
    const updates$ = new Subject<CommandStatusUpdate>();
    commandServiceMock.sendConfig.mockReturnValue(updates$.asObservable());

    const component = TestBed.createComponent(GatewayDetailPageComponent).componentInstance;
    component.gatewayId.set('gw-1');
    component.commandModalMode.set('config');
    component.commandModalOpen.set(true);

    component.submitConfigCommand({});
    component.isBusy.set(true);

    updates$.next({ commandId: 'cmd-1', status: CommandStatus.ack });

    expect(component.isBusy()).toBe(true);
    expect(gatewayServiceMock.getGatewayDetail).toHaveBeenCalledWith('gw-1');
  });
});
