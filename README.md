# NoTIP-Frontend
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NoTIPswe_notip-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NoTIPswe_notip-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=NoTIPswe_notip-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=NoTIPswe_notip-frontend)

NoTIP-Frontend e' il client web Angular della piattaforma NoTIP.

## Descrizione rapida del software

L'applicazione permette agli utenti autenticati di monitorare e gestire il sistema NoTIP tramite interfacce dedicate a:

- monitoraggio dashboard e telemetria;
- gestione gateway e sensori;
- gestione alert e configurazioni di timeout;
- funzioni amministrative (tenant, utenti, API client, soglie, costi, audit log).

L'autenticazione e la gestione sessione sono integrate con Keycloak.

## Avvio rapido

Prerequisito: deve essere disponibile un'istanza Keycloak raggiungibile e configurata.
Senza Keycloak non e' possibile autenticarsi e quindi non si puo' accedere all'applicazione.

1. Apri il progetto nel devcontainer (ambiente consigliato).
2. Installa le dipendenze con npm install.
3. Avvia l'applicazione con npm start (porta 4200).

## Comandi principali

Assicurati di usare il devcontainer per avere toolchain e dipendenze coerenti.

| Comando | Descrizione |
| --- | --- |
| npm start | Avvio applicazione in locale (Angular dev server, porta 4200). |
| npm run build | Build di produzione. |
| npm run watch | Build in watch mode per sviluppo. |
| npm run test | Esecuzione test unitari con Vitest. |
| npm run test:watch | Esecuzione test in modalita' watch. |
| npm run test:cov | Test con coverage (report LCOV + report Sonar). |
| npm run lint | Lint con fix automatico. |
| npm run lint:check | Lint in sola verifica (fallisce su warning). |
| npm run lint:report | Genera report ESLint in formato JSON. |
| npm run format | Formattazione file sorgente con Prettier. |
| npm run format:check | Verifica formattazione senza modifiche. |
| npm run typecheck | Controllo tipi TypeScript senza emit. |
| npm run fetch:openapi | Rigenera i client API a partire dai contratti OpenAPI. |
