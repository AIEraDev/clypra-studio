## [1.14.1](https://github.com/AIEraDev/clypra-studio/compare/v1.14.0...v1.14.1) (2026-06-19)


### Bug Fixes

* apply layer opacity to background panel rendering ([8f65bda](https://github.com/AIEraDev/clypra-studio/commit/8f65bda175483a3abc6515bfc8d2a97722e7641b))

# [1.14.0](https://github.com/AIEraDev/clypra-studio/compare/v1.13.0...v1.14.0) (2026-06-19)


### Features

* add opacity property for layer display/visibility animation ([73925e9](https://github.com/AIEraDev/clypra-studio/commit/73925e91048606fa12598b3a73e7f9991c728dcd))
* implement keyframe editor UI for property animation ([cec4419](https://github.com/AIEraDev/clypra-studio/commit/cec44199338cb50ba88bca9e32e381c4c003375d))

# [1.13.0](https://github.com/AIEraDev/clypra-studio/compare/v1.12.0...v1.13.0) (2026-06-19)


### Bug Fixes

* add 'none' role option and sync test inputs with layer content ([22420a5](https://github.com/AIEraDev/clypra-studio/commit/22420a53d9f1149b6601a3e076fe7d3adda903bc))
* update branding from Clypra Studio to Text Templates ([71aedd0](https://github.com/AIEraDev/clypra-studio/commit/71aedd040aec5308e24e6cad3e0272dcb7990e64))


### Features

* add fontWeight and background panel properties with border support ([9046d00](https://github.com/AIEraDev/clypra-studio/commit/9046d000302992e302f8eb2bed8f778e16678d38))

# [1.12.0](https://github.com/AIEraDev/clypra-studio/compare/v1.11.0...v1.12.0) (2026-06-19)


### Features

* enhance studio workspace and template publishing ([d252827](https://github.com/AIEraDev/clypra-studio/commit/d252827294cece1e39ae82fd0dd57e5ee15e35b4))

# [1.11.0](https://github.com/AIEraDev/clypra-studio/compare/v1.10.1...v1.11.0) (2026-06-19)


### Bug Fixes

* use relative base path in Vite for portable asset loading ([e1eb44a](https://github.com/AIEraDev/clypra-studio/commit/e1eb44a976cdab74074448e47425295847a24332))


### Features

* login modal UI and global fetch interceptor auth integration ([698a6ec](https://github.com/AIEraDev/clypra-studio/commit/698a6ecc644e23de7ffbb5c3d440a6a5de291a61))
* render BodyEffectWorkspace in App ([93d03c7](https://github.com/AIEraDev/clypra-studio/commit/93d03c7a2e07fa88b06eb619d16b463bc21eacfa))
* restrict LoginModal to Sign In only, removing register UI ([4860d76](https://github.com/AIEraDev/clypra-studio/commit/4860d76e78ad295fc57cb025f4f6a3b6ef02102b))

## [1.10.1](https://github.com/AIEraDev/clypra-studio/compare/v1.10.0...v1.10.1) (2026-06-18)


### Bug Fixes

* remove orphaned async code in TemplateWorkspace ([a2980f8](https://github.com/AIEraDev/clypra-studio/commit/a2980f89656919474cc22911c0b4dc49216fdc9c))
* resolve all TypeScript linting errors ([38564a6](https://github.com/AIEraDev/clypra-studio/commit/38564a6a2d8ca843c548200c4f21dc8d78033266))
* update audio publishing to use API endpoint instead of direct R2 upload ([5745152](https://github.com/AIEraDev/clypra-studio/commit/57451524b322881deb77792d3f269d09f983cbfa))

# [1.10.0](https://github.com/AIEraDev/clypra-studio/compare/v1.9.0...v1.10.0) (2026-06-17)


### Bug Fixes

* Clear validation errors after AI generation and update AI endpoint URL ([60b224c](https://github.com/AIEraDev/clypra-studio/commit/60b224c996e314fd780932748248778bd3b076b3))
* Enable text selection in all inputs globally ([23fc78c](https://github.com/AIEraDev/clypra-studio/commit/23fc78cbeb0ca42cb0ecb23fbadce3b7352a2249))
* Prevent form reset when config changes after AI generation ([ebb03c0](https://github.com/AIEraDev/clypra-studio/commit/ebb03c073920978b81363218caaf0297052ae608))
* Remove select-none from modal overlays and improve input detection ([2879b73](https://github.com/AIEraDev/clypra-studio/commit/2879b73da2e07561916ea3b18483b9b475405acb))
* Resolve infinite loop preventing input in PublishEffectModal ([6851e52](https://github.com/AIEraDev/clypra-studio/commit/6851e524269f591ac234a73e91653a2c2e1125ca))


### Features

* add R2 direct publishing implementation ([ac55017](https://github.com/AIEraDev/clypra-studio/commit/ac550172b2c24a8f3cbc175328a9797a8b662d32))
* **clypra-engine:** implement dynamic google font injection and fallback weight checking for fontLoader ([128e5ce](https://github.com/AIEraDev/clypra-studio/commit/128e5cedb9d8e62a7f0289a69e8cf0f4c2006ef4))

# [1.9.0](https://github.com/AIEraDev/clypra-studio/compare/v1.8.0...v1.9.0) (2026-06-16)


### Features

* **engine:** add fire and particle light effects ([ebea313](https://github.com/AIEraDev/clypra-studio/commit/ebea3136bd94bb4b45cfbcda82ff68d6a9e30e6f))

# [1.8.0](https://github.com/AIEraDev/clypra-studio/compare/v1.7.0...v1.8.0) (2026-06-16)


### Features

* add category support for renderer-based effects API ([1c90b67](https://github.com/AIEraDev/clypra-studio/commit/1c90b67054f46027df9680de36acc47c64ba73aa))

# [1.7.0](https://github.com/AIEraDev/clypra-studio/compare/v1.6.0...v1.7.0) (2026-06-16)


### Bug Fixes

* render video frame on load and when seeking while paused ([5b5693c](https://github.com/AIEraDev/clypra-studio/commit/5b5693c0e5853d1fef0511cd02bfa9a267215bed))


### Features

* add renderer-based effects system with 11 effects ([d4bc9d1](https://github.com/AIEraDev/clypra-studio/commit/d4bc9d12d6c3decd32fce9ec6e37aa9f864ae263))

# [1.6.0](https://github.com/AIEraDev/clypra-studio/compare/v1.5.0...v1.6.0) (2026-06-16)


### Bug Fixes

* adjusted layout ([f1bfca8](https://github.com/AIEraDev/clypra-studio/commit/f1bfca8ab1111d8fae18171040cd76dc508a4631))
* correct string quote mismatch in useGitHubPublish ([66072c0](https://github.com/AIEraDev/clypra-studio/commit/66072c03b73f17694772484e4a10b2f88574cea9))
* ensure AI-generated effect params are always populated ([52fe912](https://github.com/AIEraDev/clypra-studio/commit/52fe9126472be947e3d91c69d30a468ff4d71bc4))
* resolve horizontal layout overflow on landing page ([0e362d5](https://github.com/AIEraDev/clypra-studio/commit/0e362d5b9ad65ed721d6397e4d7c8dc084e09c8a))
* resolve mobile layout overflow in navigation header ([b1f7498](https://github.com/AIEraDev/clypra-studio/commit/b1f74988039f214d51c4a8637803a6442126bad0))
* use Git Data API for large animated sticker files ([433f051](https://github.com/AIEraDev/clypra-studio/commit/433f051777fc6601c1138a6201823b0623b9fa4b))


### Features

* add creator section and social links to showcase page ([45a56ca](https://github.com/AIEraDev/clypra-studio/commit/45a56caac08c236c6ad99822fd54e1941a003fdc))
* add dynamic animations to all video effect previews ([683e55c](https://github.com/AIEraDev/clypra-studio/commit/683e55cbdb62cc5e5e1f6f046c3ed9cd60e282d7))
* add video effect preset publishing system ([4ac7f4a](https://github.com/AIEraDev/clypra-studio/commit/4ac7f4aff85c101dcccc85c552f43b2c77e6fd66))
* add WebM export for effect preview canvas ([4b82965](https://github.com/AIEraDev/clypra-studio/commit/4b82965c734f8c9922839988532f734aa075a42c))
* integrate video effects workspace into Studio navigation ([1947815](https://github.com/AIEraDev/clypra-studio/commit/1947815211eb3f3843d6c51ce11e94fd2a5edac7))

# [1.5.0](https://github.com/AIEraDev/clypra-studio/compare/v1.4.0...v1.5.0) (2026-06-12)


### Bug Fixes

* add validation and improve GIF auto-switch logic ([643563f](https://github.com/AIEraDev/clypra-studio/commit/643563f12326825557b323f01e56aa7998a3f4aa))
* allow GIF thumbnails for all sticker formats ([f5dc469](https://github.com/AIEraDev/clypra-studio/commit/f5dc469b40bb02d024a270e952bf62ad9b7650e3))
* auto-switch to GIF format when GIF image is uploaded ([aaf98bc](https://github.com/AIEraDev/clypra-studio/commit/aaf98bc0d045975942bb8677b24fb9aaeafd00b7))
* improve GIF export with better frame capture and debugging ([d7eb50c](https://github.com/AIEraDev/clypra-studio/commit/d7eb50c57d0fc3c567ac30ec4f58093f4575cf88))
* remove unused isMp4ExportSupported import ([ade6d31](https://github.com/AIEraDev/clypra-studio/commit/ade6d31c518eb597e2a50ec33c3255cb53940b52))
* respect user's format selection, don't auto-switch ([e836c27](https://github.com/AIEraDev/clypra-studio/commit/e836c27041be1857396a07d32c46fbaa7d871533))


### Features

* add GIF export for Lottie animations ([ee29b94](https://github.com/AIEraDev/clypra-studio/commit/ee29b9447dcffbcaaa1d33fd15fda0eae3c5ea78))
* add GIF support to sticker image file upload ([66ccfd2](https://github.com/AIEraDev/clypra-studio/commit/66ccfd264a0028866a1824491c4b934e2195fde1))
* add MP4 export for Lottie animations ([0e7233e](https://github.com/AIEraDev/clypra-studio/commit/0e7233e9a51b8043384b79d5a8862da5c40cbba2))
* add video effects and filters categories to studio publishing modal ([b4b5b40](https://github.com/AIEraDev/clypra-studio/commit/b4b5b40831fb0c41df731b2c2ffd23f4e5b3f235))

# [1.4.0](https://github.com/AIEraDev/clypra-studio/compare/v1.3.0...v1.4.0) (2026-06-06)


### Bug Fixes

* **engine:** Fix text effect property mapping and add runtime validation ([943871c](https://github.com/AIEraDev/clypra-studio/commit/943871cf6275cf276563c5b4e385134fc4b17909))


### Features

* updated bounding box for type definition ([a3b6528](https://github.com/AIEraDev/clypra-studio/commit/a3b65282dbe36a1c3389dd3d069e81a279159f2a))

## [1.3.1](https://github.com/AIEraDev/clypra-studio/compare/v1.3.0...v1.3.1) (2026-06-06)


### Bug Fixes

* **engine:** Fix text effect property mapping and add runtime validation ([943871c](https://github.com/AIEraDev/clypra-studio/commit/943871cf6275cf276563c5b4e385134fc4b17909))

# [1.3.0](https://github.com/AIEraDev/clypra-studio/compare/v1.2.1...v1.3.0) (2026-06-06)


### Features

* add programmatic update APIs and TextEffectBuilder to clypra-engine ([68595cb](https://github.com/AIEraDev/clypra-studio/commit/68595cbfadcea6707d38f9dce2fd1dbe42b20546))

## [1.2.1](https://github.com/AIEraDev/clypra-studio/compare/v1.2.0...v1.2.1) (2026-06-06)


### Bug Fixes

* vertical centering layout logic in engine, inkBrush, and code generator; add text layout unit tests ([6ecde27](https://github.com/AIEraDev/clypra-studio/commit/6ecde279c1e1cab07b586d2abc6e1f1d5977a6b5))

# [1.2.0](https://github.com/AIEraDev/clypra-studio/compare/v1.1.2...v1.2.0) (2026-06-04)


### Bug Fixes

* add ctx.filter support check with shadow fallback for bevel and stroke blur ([7a62053](https://github.com/AIEraDev/clypra-studio/commit/7a620537f987fc10186493f3a4f7069378cdbd5e))


### Features

* improve AI effect naming with category enforcement ([21b81e1](https://github.com/AIEraDev/clypra-studio/commit/21b81e13cecb3720ca6e75298345041c8221526c))

## [1.1.2](https://github.com/AIEraDev/clypra-studio/compare/v1.1.1...v1.1.2) (2026-06-04)


### Bug Fixes

* **engine:** unify platform canvas pooling and evaluator compositor fallback ([c940a80](https://github.com/AIEraDev/clypra-studio/commit/c940a80e4a0b84b0a9404930f1d332eac5d1cf80))

## [1.1.1](https://github.com/AIEraDev/clypra-studio/compare/v1.1.0...v1.1.1) (2026-06-03)


### Bug Fixes

* **engine:** 6 concrete bugs across platform, fontLoader, evaluate, textLayout, renderer ([7c13478](https://github.com/AIEraDev/clypra-studio/commit/7c13478bfe158c8698e90a94715f9cec594285df)), closes [#000000](https://github.com/AIEraDev/clypra-studio/issues/000000)

# [1.1.0](https://github.com/AIEraDev/clypra-studio/compare/v1.0.2...v1.1.0) (2026-06-03)


### Bug Fixes

* **studio:** toolbar overflow-auto with hidden scrollbar for narrow viewports ([72dad2d](https://github.com/AIEraDev/clypra-studio/commit/72dad2d76f38f279aac97c5be621a64dcd390a9b))


### Features

* **engine:** platform capability module, canvas-utils, and canonical constants ([ae15cd6](https://github.com/AIEraDev/clypra-studio/commit/ae15cd6bac584f2f6ce9b3d5cc0a6ccd3cfd1a32))
* **studio:** redesign preview canvas toolbar — single row, compact platform dropdown ([92725a9](https://github.com/AIEraDev/clypra-studio/commit/92725a9d5cde6356c57d23f0d6f97f3fa45e2d97))

## [1.0.2](https://github.com/AIEraDev/clypra-studio/compare/v1.0.1...v1.0.2) (2026-06-02)


### Bug Fixes

* **engine:** add README.md for npm package page ([4cf12a7](https://github.com/AIEraDev/clypra-studio/commit/4cf12a7c0c0a980f60af517f075879507645b7b6))
* **engine:** trigger release to publish readme ([5c09b52](https://github.com/AIEraDev/clypra-studio/commit/5c09b523a638bec7b9a63f7d417a4bceb20e572e))
* **engine:** trigger release to publish readme ([c8cd1bd](https://github.com/AIEraDev/clypra-studio/commit/c8cd1bd7ea1ca1f833e3e27465a79e0e6fa360f2))

## [1.0.1](https://github.com/AIEraDev/clypra-studio/compare/v1.0.0...v1.0.1) (2026-06-02)


### Bug Fixes

* **deploy:** add root vercel.json with correct outputDirectory for monorepo ([c2b5db6](https://github.com/AIEraDev/clypra-studio/commit/c2b5db6ea0186083ed6148fa4763e7f5694c1020))
* **engine:** expose all missing exports — lottieEditor, lottieParser, InkBrushEngine ([ad8b1d6](https://github.com/AIEraDev/clypra-studio/commit/ad8b1d6071a94b7ff42217f7602e5c492b173ead))

# 1.0.0 (2026-06-02)


### Bug Fixes

* adjust global font size percentage ([9a440e9](https://github.com/AIEraDev/clypra-studio/commit/9a440e9cd702f67089875c72e8e4f56da0ab2a4f))
* **ci:** restore credentials in checkout so semantic-release can detect branch state ([faf2b80](https://github.com/AIEraDev/clypra-studio/commit/faf2b8027f10c46b6f347d0de3700f03fc25f912))
* **ci:** switch @clypra/engine build from tsc to tsup, fix publish workflow ([600a885](https://github.com/AIEraDev/clypra-studio/commit/600a8858caedeb84160721ebb2f35b38aa68d0d8))
* cleanup ddefault presets ([eeeb909](https://github.com/AIEraDev/clypra-studio/commit/eeeb909d4994e6a8b048ba23a32357d6fa5d3d1f))
* clear canvas before render in evaluate.ts fast path — eliminates ghost frame bleed-through ([e091234](https://github.com/AIEraDev/clypra-studio/commit/e09123462c016c15cff4275b970db94158ff3d4c))
* clip canvas overflow on preview card + default ?q=templates on load ([4107549](https://github.com/AIEraDev/clypra-studio/commit/4107549b55980f4698c9eb19a687030c153bbaf4))
* correct canvas stage dimensions to match CSS-scaled footprint, eliminates ghost overlap ([4e6356f](https://github.com/AIEraDev/clypra-studio/commit/4e6356f8cba21bb8a0c2ad440131c7dd08006a01))
* **engine:** add package header comment to index.ts, trigger v1.0.0 publish ([d7da31e](https://github.com/AIEraDev/clypra-studio/commit/d7da31e7fe9579df4a21ef6813cafdb918ed2cab))
* **engine:** add repository field to package.json for npm provenance validation ([f064228](https://github.com/AIEraDev/clypra-studio/commit/f064228971cc5da957af5af5aa0db45b931f1fcb))
* **engine:** retrigger publish with refreshed NPM_TOKEN ([d8e1e90](https://github.com/AIEraDev/clypra-studio/commit/d8e1e90211771e1ec3c035f76782ee99ce2512ea))
* **engine:** trigger publish after npm 2FA set to authorization-only ([bf3a148](https://github.com/AIEraDev/clypra-studio/commit/bf3a1484c87fa8a9a4f56e2e49bef8a261648441))
* preserve workspace mode URLs on page reload ([2a69b83](https://github.com/AIEraDev/clypra-studio/commit/2a69b83faedb931e8f35fdcf1532376e27fc07d4))
* prevent API Key button text from wrapping ([3f92d27](https://github.com/AIEraDev/clypra-studio/commit/3f92d27bd07f7d25d63a6b7018ee9a3b1cb9f7ac))
* remove default blank preset to no stroke ([55f64ab](https://github.com/AIEraDev/clypra-studio/commit/55f64ab1753c829d8deecd7383b282d7d8550696))
* target public npm registry in publish workflow ([82a599f](https://github.com/AIEraDev/clypra-studio/commit/82a599f8b811e3d1536a80b06e32e8a150ac2ce6))
* update Vercel routing for SPA client-side navigation ([78d620f](https://github.com/AIEraDev/clypra-studio/commit/78d620ff4f0964e3e3b1cc7a4ff7615f4bac957f))
* use document.fonts.load() per-font to eliminate font family race condition ([9ae9d30](https://github.com/AIEraDev/clypra-studio/commit/9ae9d30393440345bd2f6a75878bbe1cef7e08b5))


### Features

* add Gemini API Key button to header and Lottie page ([e3796b7](https://github.com/AIEraDev/clypra-studio/commit/e3796b77d6605bc5396578f31dd147534ce151a7))
* add landing page, assets, and routing ([63db1b1](https://github.com/AIEraDev/clypra-studio/commit/63db1b1e0115c38a569760a82c16a6bc3038957f))
* add professional branding to studio header and update SEO ([493fe98](https://github.com/AIEraDev/clypra-studio/commit/493fe989da737b08a8cf1df98faf52d7a0e08ecd))
* Add template publishing and Lottie editing capabilities ([1b27c52](https://github.com/AIEraDev/clypra-studio/commit/1b27c52b5c6b93a14a6085df80403793331297d6))
* add Vercel Analytics and Speed Insights ([a72a3f5](https://github.com/AIEraDev/clypra-studio/commit/a72a3f5b247bc929d2967b822439a152311aa982))
* CapCut-grade Lottie text template system + navigation overhaul ([07edb0e](https://github.com/AIEraDev/clypra-studio/commit/07edb0ecaed3af33717db2a4058014dbab3242be))
* complete layered effect engine roadmap and lab integration ([ca3a0e0](https://github.com/AIEraDev/clypra-studio/commit/ca3a0e035c0d38ee673f4d61847b949c5201b0d5))
* gradient-shaded 3D bevel with AO darkening and specular rim highlight ([baed333](https://github.com/AIEraDev/clypra-studio/commit/baed333c661515c8ae2dd72f6ac51f59842cd8bf))
* implement professional URL-based navigation for workspace modes ([35c3a9a](https://github.com/AIEraDev/clypra-studio/commit/35c3a9a7d8090d9686ceb5d46c36d4e753fd5958))
* initialize Clypra Text Effect Studio application ([f86b5a2](https://github.com/AIEraDev/clypra-studio/commit/f86b5a23d61367544b2b72b01bb7ae519c7d9c03))
* integrate semantic-release for automated versioning and publishing ([e0d7d99](https://github.com/AIEraDev/clypra-studio/commit/e0d7d9940dc505a6b2140fa396b0ba15b84b3430))
* refactor clypra studio to monorepo with @clypra/engine shared package ([6a7196c](https://github.com/AIEraDev/clypra-studio/commit/6a7196c1c56ade3a9943028ecbc7ded473d0e540))
* replace engine class label with Clypra Studio brand badge in preview canvas ([a7ce5c3](https://github.com/AIEraDev/clypra-studio/commit/a7ce5c33fc8e5175187e056d008b53031aa52303))
* restructure categories to align with professional NLE standards ([5a9d602](https://github.com/AIEraDev/clypra-studio/commit/5a9d60235d2f6409c3e134084abb399798449ce4))
* start blank on first load instead of auto-applying first preset ([16cc5c4](https://github.com/AIEraDev/clypra-studio/commit/16cc5c46ca57a8cf0beb8b914dd7a18a9913e267))

# 1.0.0 (2026-06-02)


### Bug Fixes

* adjust global font size percentage ([9a440e9](https://github.com/AIEraDev/clypra-studio/commit/9a440e9cd702f67089875c72e8e4f56da0ab2a4f))
* **ci:** restore credentials in checkout so semantic-release can detect branch state ([faf2b80](https://github.com/AIEraDev/clypra-studio/commit/faf2b8027f10c46b6f347d0de3700f03fc25f912))
* **ci:** switch @clypra/engine build from tsc to tsup, fix publish workflow ([600a885](https://github.com/AIEraDev/clypra-studio/commit/600a8858caedeb84160721ebb2f35b38aa68d0d8))
* cleanup ddefault presets ([eeeb909](https://github.com/AIEraDev/clypra-studio/commit/eeeb909d4994e6a8b048ba23a32357d6fa5d3d1f))
* clear canvas before render in evaluate.ts fast path — eliminates ghost frame bleed-through ([e091234](https://github.com/AIEraDev/clypra-studio/commit/e09123462c016c15cff4275b970db94158ff3d4c))
* clip canvas overflow on preview card + default ?q=templates on load ([4107549](https://github.com/AIEraDev/clypra-studio/commit/4107549b55980f4698c9eb19a687030c153bbaf4))
* correct canvas stage dimensions to match CSS-scaled footprint, eliminates ghost overlap ([4e6356f](https://github.com/AIEraDev/clypra-studio/commit/4e6356f8cba21bb8a0c2ad440131c7dd08006a01))
* **engine:** add package header comment to index.ts, trigger v1.0.0 publish ([d7da31e](https://github.com/AIEraDev/clypra-studio/commit/d7da31e7fe9579df4a21ef6813cafdb918ed2cab))
* **engine:** retrigger publish with refreshed NPM_TOKEN ([d8e1e90](https://github.com/AIEraDev/clypra-studio/commit/d8e1e90211771e1ec3c035f76782ee99ce2512ea))
* **engine:** trigger publish after npm 2FA set to authorization-only ([bf3a148](https://github.com/AIEraDev/clypra-studio/commit/bf3a1484c87fa8a9a4f56e2e49bef8a261648441))
* preserve workspace mode URLs on page reload ([2a69b83](https://github.com/AIEraDev/clypra-studio/commit/2a69b83faedb931e8f35fdcf1532376e27fc07d4))
* prevent API Key button text from wrapping ([3f92d27](https://github.com/AIEraDev/clypra-studio/commit/3f92d27bd07f7d25d63a6b7018ee9a3b1cb9f7ac))
* remove default blank preset to no stroke ([55f64ab](https://github.com/AIEraDev/clypra-studio/commit/55f64ab1753c829d8deecd7383b282d7d8550696))
* target public npm registry in publish workflow ([82a599f](https://github.com/AIEraDev/clypra-studio/commit/82a599f8b811e3d1536a80b06e32e8a150ac2ce6))
* update Vercel routing for SPA client-side navigation ([78d620f](https://github.com/AIEraDev/clypra-studio/commit/78d620ff4f0964e3e3b1cc7a4ff7615f4bac957f))
* use document.fonts.load() per-font to eliminate font family race condition ([9ae9d30](https://github.com/AIEraDev/clypra-studio/commit/9ae9d30393440345bd2f6a75878bbe1cef7e08b5))


### Features

* add Gemini API Key button to header and Lottie page ([e3796b7](https://github.com/AIEraDev/clypra-studio/commit/e3796b77d6605bc5396578f31dd147534ce151a7))
* add landing page, assets, and routing ([63db1b1](https://github.com/AIEraDev/clypra-studio/commit/63db1b1e0115c38a569760a82c16a6bc3038957f))
* add professional branding to studio header and update SEO ([493fe98](https://github.com/AIEraDev/clypra-studio/commit/493fe989da737b08a8cf1df98faf52d7a0e08ecd))
* Add template publishing and Lottie editing capabilities ([1b27c52](https://github.com/AIEraDev/clypra-studio/commit/1b27c52b5c6b93a14a6085df80403793331297d6))
* add Vercel Analytics and Speed Insights ([a72a3f5](https://github.com/AIEraDev/clypra-studio/commit/a72a3f5b247bc929d2967b822439a152311aa982))
* CapCut-grade Lottie text template system + navigation overhaul ([07edb0e](https://github.com/AIEraDev/clypra-studio/commit/07edb0ecaed3af33717db2a4058014dbab3242be))
* complete layered effect engine roadmap and lab integration ([ca3a0e0](https://github.com/AIEraDev/clypra-studio/commit/ca3a0e035c0d38ee673f4d61847b949c5201b0d5))
* gradient-shaded 3D bevel with AO darkening and specular rim highlight ([baed333](https://github.com/AIEraDev/clypra-studio/commit/baed333c661515c8ae2dd72f6ac51f59842cd8bf))
* implement professional URL-based navigation for workspace modes ([35c3a9a](https://github.com/AIEraDev/clypra-studio/commit/35c3a9a7d8090d9686ceb5d46c36d4e753fd5958))
* initialize Clypra Text Effect Studio application ([f86b5a2](https://github.com/AIEraDev/clypra-studio/commit/f86b5a23d61367544b2b72b01bb7ae519c7d9c03))
* integrate semantic-release for automated versioning and publishing ([e0d7d99](https://github.com/AIEraDev/clypra-studio/commit/e0d7d9940dc505a6b2140fa396b0ba15b84b3430))
* refactor clypra studio to monorepo with @clypra/engine shared package ([6a7196c](https://github.com/AIEraDev/clypra-studio/commit/6a7196c1c56ade3a9943028ecbc7ded473d0e540))
* replace engine class label with Clypra Studio brand badge in preview canvas ([a7ce5c3](https://github.com/AIEraDev/clypra-studio/commit/a7ce5c33fc8e5175187e056d008b53031aa52303))
* restructure categories to align with professional NLE standards ([5a9d602](https://github.com/AIEraDev/clypra-studio/commit/5a9d60235d2f6409c3e134084abb399798449ce4))
* start blank on first load instead of auto-applying first preset ([16cc5c4](https://github.com/AIEraDev/clypra-studio/commit/16cc5c46ca57a8cf0beb8b914dd7a18a9913e267))

## [1.0.3](https://github.com/AIEraDev/clypra-studio/compare/v1.0.2...v1.0.3) (2026-06-02)


### Bug Fixes

* **engine:** retrigger publish with refreshed NPM_TOKEN ([d8e1e90](https://github.com/AIEraDev/clypra-studio/commit/d8e1e90211771e1ec3c035f76782ee99ce2512ea))

## [1.0.2](https://github.com/AIEraDev/clypra-studio/compare/v1.0.1...v1.0.2) (2026-06-02)


### Bug Fixes

* **engine:** trigger publish after npm 2FA set to authorization-only ([bf3a148](https://github.com/AIEraDev/clypra-studio/commit/bf3a1484c87fa8a9a4f56e2e49bef8a261648441))

## [1.0.1](https://github.com/AIEraDev/clypra-studio/compare/v1.0.0...v1.0.1) (2026-06-02)


### Bug Fixes

* **ci:** restore credentials in checkout so semantic-release can detect branch state ([faf2b80](https://github.com/AIEraDev/clypra-studio/commit/faf2b8027f10c46b6f347d0de3700f03fc25f912))

# 1.0.0 (2026-06-02)


### Bug Fixes

* adjust global font size percentage ([9a440e9](https://github.com/AIEraDev/clypra-studio/commit/9a440e9cd702f67089875c72e8e4f56da0ab2a4f))
* **ci:** switch @clypra/engine build from tsc to tsup, fix publish workflow ([600a885](https://github.com/AIEraDev/clypra-studio/commit/600a8858caedeb84160721ebb2f35b38aa68d0d8))
* cleanup ddefault presets ([eeeb909](https://github.com/AIEraDev/clypra-studio/commit/eeeb909d4994e6a8b048ba23a32357d6fa5d3d1f))
* clear canvas before render in evaluate.ts fast path — eliminates ghost frame bleed-through ([e091234](https://github.com/AIEraDev/clypra-studio/commit/e09123462c016c15cff4275b970db94158ff3d4c))
* clip canvas overflow on preview card + default ?q=templates on load ([4107549](https://github.com/AIEraDev/clypra-studio/commit/4107549b55980f4698c9eb19a687030c153bbaf4))
* correct canvas stage dimensions to match CSS-scaled footprint, eliminates ghost overlap ([4e6356f](https://github.com/AIEraDev/clypra-studio/commit/4e6356f8cba21bb8a0c2ad440131c7dd08006a01))
* preserve workspace mode URLs on page reload ([2a69b83](https://github.com/AIEraDev/clypra-studio/commit/2a69b83faedb931e8f35fdcf1532376e27fc07d4))
* prevent API Key button text from wrapping ([3f92d27](https://github.com/AIEraDev/clypra-studio/commit/3f92d27bd07f7d25d63a6b7018ee9a3b1cb9f7ac))
* remove default blank preset to no stroke ([55f64ab](https://github.com/AIEraDev/clypra-studio/commit/55f64ab1753c829d8deecd7383b282d7d8550696))
* target public npm registry in publish workflow ([82a599f](https://github.com/AIEraDev/clypra-studio/commit/82a599f8b811e3d1536a80b06e32e8a150ac2ce6))
* update Vercel routing for SPA client-side navigation ([78d620f](https://github.com/AIEraDev/clypra-studio/commit/78d620ff4f0964e3e3b1cc7a4ff7615f4bac957f))
* use document.fonts.load() per-font to eliminate font family race condition ([9ae9d30](https://github.com/AIEraDev/clypra-studio/commit/9ae9d30393440345bd2f6a75878bbe1cef7e08b5))


### Features

* add Gemini API Key button to header and Lottie page ([e3796b7](https://github.com/AIEraDev/clypra-studio/commit/e3796b77d6605bc5396578f31dd147534ce151a7))
* add landing page, assets, and routing ([63db1b1](https://github.com/AIEraDev/clypra-studio/commit/63db1b1e0115c38a569760a82c16a6bc3038957f))
* add professional branding to studio header and update SEO ([493fe98](https://github.com/AIEraDev/clypra-studio/commit/493fe989da737b08a8cf1df98faf52d7a0e08ecd))
* Add template publishing and Lottie editing capabilities ([1b27c52](https://github.com/AIEraDev/clypra-studio/commit/1b27c52b5c6b93a14a6085df80403793331297d6))
* add Vercel Analytics and Speed Insights ([a72a3f5](https://github.com/AIEraDev/clypra-studio/commit/a72a3f5b247bc929d2967b822439a152311aa982))
* CapCut-grade Lottie text template system + navigation overhaul ([07edb0e](https://github.com/AIEraDev/clypra-studio/commit/07edb0ecaed3af33717db2a4058014dbab3242be))
* complete layered effect engine roadmap and lab integration ([ca3a0e0](https://github.com/AIEraDev/clypra-studio/commit/ca3a0e035c0d38ee673f4d61847b949c5201b0d5))
* gradient-shaded 3D bevel with AO darkening and specular rim highlight ([baed333](https://github.com/AIEraDev/clypra-studio/commit/baed333c661515c8ae2dd72f6ac51f59842cd8bf))
* implement professional URL-based navigation for workspace modes ([35c3a9a](https://github.com/AIEraDev/clypra-studio/commit/35c3a9a7d8090d9686ceb5d46c36d4e753fd5958))
* initialize Clypra Text Effect Studio application ([f86b5a2](https://github.com/AIEraDev/clypra-studio/commit/f86b5a23d61367544b2b72b01bb7ae519c7d9c03))
* integrate semantic-release for automated versioning and publishing ([e0d7d99](https://github.com/AIEraDev/clypra-studio/commit/e0d7d9940dc505a6b2140fa396b0ba15b84b3430))
* refactor clypra studio to monorepo with @clypra/engine shared package ([6a7196c](https://github.com/AIEraDev/clypra-studio/commit/6a7196c1c56ade3a9943028ecbc7ded473d0e540))
* replace engine class label with Clypra Studio brand badge in preview canvas ([a7ce5c3](https://github.com/AIEraDev/clypra-studio/commit/a7ce5c33fc8e5175187e056d008b53031aa52303))
* restructure categories to align with professional NLE standards ([5a9d602](https://github.com/AIEraDev/clypra-studio/commit/5a9d60235d2f6409c3e134084abb399798449ce4))
* start blank on first load instead of auto-applying first preset ([16cc5c4](https://github.com/AIEraDev/clypra-studio/commit/16cc5c46ca57a8cf0beb8b914dd7a18a9913e267))
