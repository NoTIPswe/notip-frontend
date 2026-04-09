# [1.6.0](https://github.com/NoTIPswe/notip-frontend/compare/v1.5.0...v1.6.0) (2026-04-09)


### Bug Fixes

* audit missing user id and sensor details ([888dcb7](https://github.com/NoTIPswe/notip-frontend/commit/888dcb732a44f7d6cfb4f6e764116d309a4a409d))
* auth timestamp, graph, still impersonation to be done ([73de25a](https://github.com/NoTIPswe/notip-frontend/commit/73de25a41eb606570481322ca6ed4879a9a3842a))
* bugs ([d3e0ca3](https://github.com/NoTIPswe/notip-frontend/commit/d3e0ca3354d1f0445b34cce560171374dee46156))
* bugs ([225f6ed](https://github.com/NoTIPswe/notip-frontend/commit/225f6ed56eafa4b019110711d356c7cb5d98ed53))
* **command.service:** validate send_frequency_ms to ensure it is a finite number ([b8760c6](https://github.com/NoTIPswe/notip-frontend/commit/b8760c67bd4202369769ae0adc9bdb22ff4f0107))
* dashboard test ([1ce329e](https://github.com/NoTIPswe/notip-frontend/commit/1ce329ef66d13a853b72185dbfef01a4f4356563))
* mismatch dto variables ([317417e](https://github.com/NoTIPswe/notip-frontend/commit/317417ec57254dd26fc25c9a2c54b2ad4ea50b96))
* query parameter order in measureControllerQuery ([7d48f56](https://github.com/NoTIPswe/notip-frontend/commit/7d48f56177b2679bddaad1db5b96d6d4da2e9c65))
* removing of unit from telemetryEnvelope, fix of gateway config update, fix thresholds ([c5d0bcb](https://github.com/NoTIPswe/notip-frontend/commit/c5d0bcb76cb67c0fa5f231352601b5f316970ef3))
* sensorthreshold ([0f7dbbd](https://github.com/NoTIPswe/notip-frontend/commit/0f7dbbd8a98fb1f2e647a5587798728bd1c96950))
* use of correct api for impersonation ([8535b61](https://github.com/NoTIPswe/notip-frontend/commit/8535b6169541811652f6b909a31047c8c1fa3d83))


### Features

* **auth:** improve impersonation handling in setImpersonating method ([e69f15a](https://github.com/NoTIPswe/notip-frontend/commit/e69f15a044ceeabede9b0158861a6b207cdcf520))
* **dashboard:** enhance telemetry chart with sensor count and improved data handling ([d75c0b9](https://github.com/NoTIPswe/notip-frontend/commit/d75c0b92b8f8d1e3033e9d3a6b97979689bcf3d6))
* **dashboard:** enhance telemetry table and pagination controls ([95b72e2](https://github.com/NoTIPswe/notip-frontend/commit/95b72e235056195cd0277d945fb5cb2319a3df35))
* division of query datas and stream datas, introduction of exporting ([058f66f](https://github.com/NoTIPswe/notip-frontend/commit/058f66fcd072ce79c28b6fa3d9cfacc21005a8fb))
* **gateway-rename-modal:** implement rename modal component with form and event handling ([86eb4fb](https://github.com/NoTIPswe/notip-frontend/commit/86eb4fb6814ec30a701e7e65a9253563ce2c394e))
* **tests:** add unit tests for authentication flow and error handling in various components ([94a1393](https://github.com/NoTIPswe/notip-frontend/commit/94a1393a8b6611e0c2f6f6548956c68a75625843))
* **tests:** add unit tests for impersonation context and modal layer component ([8c4f5ee](https://github.com/NoTIPswe/notip-frontend/commit/8c4f5eeea60f74f9f84c1cc30999eeead3f10e48))
* **tests:** enhance unit tests for various components and services ([866edeb](https://github.com/NoTIPswe/notip-frontend/commit/866edeb56ad1bafcac724e55c86670020808bf8d))
* update user and sensor management pages with English translations and new modal layer component ([40ce739](https://github.com/NoTIPswe/notip-frontend/commit/40ce739e84ba496dcb5a270ab6b4af9401005993))

# [1.5.0](https://github.com/NoTIPswe/notip-frontend/compare/v1.4.0...v1.5.0) (2026-04-03)


### Bug Fixes

* aggiorna service/component ai DTO OpenAPI rigenerati ([b22bd3c](https://github.com/NoTIPswe/notip-frontend/commit/b22bd3ccb7ba202d7f3918a5e65c7b338e90074f))
* corrected tenant update values, inserted gateway model on creation ([5da0ac9](https://github.com/NoTIPswe/notip-frontend/commit/5da0ac930d7aebb842b0d08e66061b49c1bfb3c6))


### Features

* refactoring creation and update form ([af9fee3](https://github.com/NoTIPswe/notip-frontend/commit/af9fee3a1217d26ba6a69446b9275932b83a030f))

# [1.4.0](https://github.com/NoTIPswe/notip-frontend/compare/v1.3.1...v1.4.0) (2026-04-02)


### Features

* implemented unauthorized, forbidden, not found and unknown error pages; update page button ([c642179](https://github.com/NoTIPswe/notip-frontend/commit/c64217941ab1fe67365a23462e737f3c49799158))

## [1.3.1](https://github.com/NoTIPswe/notip-frontend/compare/v1.3.0...v1.3.1) (2026-04-02)


### Bug Fixes

* redirecting to correct page based on role ([186bfce](https://github.com/NoTIPswe/notip-frontend/commit/186bfcef5c9721d0d8e50bc67993fd38c6393e54))

# [1.3.0](https://github.com/NoTIPswe/notip-frontend/compare/v1.2.0...v1.3.0) (2026-04-02)


### Features

* introduction of token JWT management ([0f61e7d](https://github.com/NoTIPswe/notip-frontend/commit/0f61e7d5acc298309dcdd9b3891534b743743d80))

# [1.2.0](https://github.com/NoTIPswe/notip-frontend/compare/v1.1.0...v1.2.0) (2026-04-02)


### Bug Fixes

* change of clientId ([e4f7fbe](https://github.com/NoTIPswe/notip-frontend/commit/e4f7fbe5bb0fec4a096f7a242d46882abfceea49))


### Features

* introduction of data-api and changing clientId ([c0a1498](https://github.com/NoTIPswe/notip-frontend/commit/c0a14984265c3f3d2c5d3481ed71714a31d6be2a))

# [1.1.0](https://github.com/NoTIPswe/notip-frontend/compare/v1.0.0...v1.1.0) (2026-04-02)


### Features

* add badges to README ([db1b24a](https://github.com/NoTIPswe/notip-frontend/commit/db1b24a1bf7aec5304362bf1fa52025b587fd151))

# 1.0.0 (2026-04-02)


### Bug Fixes

* adapting to UML ([a703069](https://github.com/NoTIPswe/notip-frontend/commit/a703069fc5265a5cd9ca3440b5b464e9e38a1051))
* adapting to UML ([d05817a](https://github.com/NoTIPswe/notip-frontend/commit/d05817a8e4de0699091d49f48fb12d35f782d87b))
* extension fo new files test coverage ([5acb51c](https://github.com/NoTIPswe/notip-frontend/commit/5acb51cdce7a520c58d71c8e707193a30e5e16c6))
* pre updating angular ([11dcfde](https://github.com/NoTIPswe/notip-frontend/commit/11dcfdeed8b6a3d42bd47fe904cb960a3b15013a))
* setup vitest for testing ([a8b10ea](https://github.com/NoTIPswe/notip-frontend/commit/a8b10eab5831ae6e8f864478a0799ccf062e1ab1))
* uniforming of message errors between Obfuscated-stream-manager.service and its tests file ([b72ec94](https://github.com/NoTIPswe/notip-frontend/commit/b72ec940199288900a6c146cff72b1c9f969554b))
* update to follow uml ([3edce81](https://github.com/NoTIPswe/notip-frontend/commit/3edce8150de00fb2fc37cc7ae4e53ea4da977525))


### Features

* add Dockerfile for building and serving the application ([2b510c1](https://github.com/NoTIPswe/notip-frontend/commit/2b510c1ec50ff8e6cbea6678b39336073980e601))
* auto generated service with openapi ([961a18f](https://github.com/NoTIPswe/notip-frontend/commit/961a18f8e0658f8745274a069668554c0f6bace7))
* business logic fully implemented ([e6450f9](https://github.com/NoTIPswe/notip-frontend/commit/e6450f9d8cb4a22ec4d51e2bbf9b24f3e41c7a77))
* extending code coverage ([44b2685](https://github.com/NoTIPswe/notip-frontend/commit/44b268518b0f62ad75e952b39632034e6dd9d094))
* implementation all components ([4c880c6](https://github.com/NoTIPswe/notip-frontend/commit/4c880c6308cd8ba8844a1306919efa4cce76a778))
* implementation of @notip/crypto-sdk, other changes related to data types ([e7a349d](https://github.com/NoTIPswe/notip-frontend/commit/e7a349d74384777631ec6e0ca21e362254d55d55))
* initializing notip-frontend with angular ([ad49660](https://github.com/NoTIPswe/notip-frontend/commit/ad49660487ad48bd888660086cee5e05c530dc9b))
* mocking tests generated by copilot ([2e493fd](https://github.com/NoTIPswe/notip-frontend/commit/2e493fd5aa4c4b41ee150f3bfacfc564aea1cade))
* scaffold core frontend architecture with auth shell, guarded routing, and service/facade integrations ([974531e](https://github.com/NoTIPswe/notip-frontend/commit/974531e4de7994c826eccdfe1de513027c2e4abc))

# 1.0.0 (2026-03-18)


### Features

* add Dockerfile for building and serving the application ([2b510c1](https://github.com/NoTIPswe/notip-frontend/commit/2b510c1ec50ff8e6cbea6678b39336073980e601))
* initializing notip-frontend with angular ([ad49660](https://github.com/NoTIPswe/notip-frontend/commit/ad49660487ad48bd888660086cee5e05c530dc9b))
