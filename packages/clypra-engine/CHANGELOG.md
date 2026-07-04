# [2.3.0](https://github.com/AIEraDev/clypra-studio/compare/v2.2.0...v2.3.0) (2026-06-30)

## 0.1.2

### Patch Changes

- Fix engine package publish by removing provenance requirement

## 0.1.1

### Patch Changes

- 6e8bd11: Add comprehensive README documentation to all packages

  - Added installation instructions
  - Added usage examples
  - Added feature lists
  - Added links to repository and issues

- Updated dependencies [6e8bd11]
  - @clypra-studio/types@0.1.1

### Features

- **ci:** add GitHub Actions workflows for new package publishing ([e8647e1](https://github.com/AIEraDev/clypra-studio/commit/e8647e1135b28d4ba4c7d87e40132d928e681c4b))

# [2.2.0](https://github.com/AIEraDev/clypra-studio/compare/v2.1.0...v2.2.0) (2026-06-30)

### Features

- **body-effects:** implement 5 mask-based body effects ([16d2e52](https://github.com/AIEraDev/clypra-studio/commit/16d2e52d48fbdadfa71d2818713cf10dfd41de37))
- **feature-providers:** add extensible feature provider architecture ([784f651](https://github.com/AIEraDev/clypra-studio/commit/784f651ab66ef4ef2f0da1708b2f481f4529abe7))
- **labs-ui:** add labs navigation panel component ([bc31c08](https://github.com/AIEraDev/clypra-studio/commit/bc31c08bb26f8edc50486cf697b68ce607eb9145))
- **labs:** add three specialized effect lab UIs ([0ac9ecb](https://github.com/AIEraDev/clypra-studio/commit/0ac9ecbed53ea99e550f9ef161bad3d87d74657f))
- **root-app:** add lab routes with lazy loading and metadata ([c844746](https://github.com/AIEraDev/clypra-studio/commit/c844746eed2059b9b0b87ecab2c2729a9b144a18))
- **runtime:** add unified runtime infrastructure for all labs ([15bffec](https://github.com/AIEraDev/clypra-studio/commit/15bffec311f5b7ac48172f397ba2c17a3e910612))
- **shader-library:** add reusable GLSL shader library package ([29467c5](https://github.com/AIEraDev/clypra-studio/commit/29467c5d46b01b20d5d5bd37f117cebbae1ae442))
- **studio-app:** integrate labs panel with admin access control ([fda2c15](https://github.com/AIEraDev/clypra-studio/commit/fda2c15d064870802167243fbcd980345b8761c0))
- **studio-chrome:** add labs navigation to left rail ([d5cb08d](https://github.com/AIEraDev/clypra-studio/commit/d5cb08d20ff7b2df38d41c8503444a896b7e6f89))
- **transition-effects:** implement 5 dual-input transitions ([eb421eb](https://github.com/AIEraDev/clypra-studio/commit/eb421ebb539ed87ecc7a3ef8fa663c4741d060e3))
- **ui:** add shared UI components for all labs ([975b295](https://github.com/AIEraDev/clypra-studio/commit/975b29553778a9829affabafdc929ae32054cda7))
- **validation:** add CLI tool for effect validation ([91b0162](https://github.com/AIEraDev/clypra-studio/commit/91b0162cccbd09060ff1adfdb70fad92ad87916f))
- **video-effects:** implement 5 production video effects ([8ff5b8c](https://github.com/AIEraDev/clypra-studio/commit/8ff5b8cf8e87c19226670015715074407347ea8b))

# [2.1.0](https://github.com/AIEraDev/clypra-studio/compare/v2.0.1...v2.1.0) (2026-06-29)

### Bug Fixes

- **studio:** resolve PixiRenderBackend initialization race condition ([d374b08](https://github.com/AIEraDev/clypra-studio/commit/d374b0869969dec6c56c8bc47f52a9fb416190a7))
- **studio:** update PixiRenderBackend shaders to GLSL 300 ES ([503ad4e](https://github.com/AIEraDev/clypra-studio/commit/503ad4edad683b4f88201b753454324faf5b3861))
- **studio:** use local workspace package for @clypra/engine ([3566e67](https://github.com/AIEraDev/clypra-studio/commit/3566e671b16afd2d7cbedc508a3a4c7b2a9039be))

### Features

- **auth:** protect in-studio Filter Lab workspace (/?q=filters) ([5ed1f32](https://github.com/AIEraDev/clypra-studio/commit/5ed1f32db3c072b36740ecc3cf560b6a4bb4c487))
- **auth:** restrict Filter Lab and MPG Playground to admin users only ([80f5af0](https://github.com/AIEraDev/clypra-studio/commit/80f5af0d60313d48c6ca83ff5a65553a48ed4665))
- **constants:** add shared filter categories constant ([352c2f6](https://github.com/AIEraDev/clypra-studio/commit/352c2f60f0f382ac84d5d58fe145dcb7fcbd6e43))
- **engine:** implement V2 MPG rendering pipeline ([b3e4395](https://github.com/AIEraDev/clypra-studio/commit/b3e43958dea464e1107369ef0b872b7b9c7747d7))
- **github:** add pull request template ([f2325e2](https://github.com/AIEraDev/clypra-studio/commit/f2325e240357692620cb866aa762422577108eac))
- **mpg:** complete V2 filter design lab with R2 publishing ([4c6ffe5](https://github.com/AIEraDev/clypra-studio/commit/4c6ffe53b8d0f0b11d4efe3bb237b14bd90fb224))
- **publish:** add V2 MPG filter publishing to R2 ([3b674f2](https://github.com/AIEraDev/clypra-studio/commit/3b674f24ca62564fabfb899155d7cd83cc6cacf0))
- **studio:** add image loading status indicators and better error logging ([83ef44c](https://github.com/AIEraDev/clypra-studio/commit/83ef44c233f50bc6a295a00955afe70dcc4a43ed))
- **studio:** add navigation between Effect Graph Sandbox and MPG Playground ([cc9e636](https://github.com/AIEraDev/clypra-studio/commit/cc9e63698cb53b8ee59cd46d16646cdbe866c612))
- **ui:** hide Filters navigation item for non-admin users ([1e85743](https://github.com/AIEraDev/clypra-studio/commit/1e857430abdaa11da09b628ee96e41f6993e7852))

## [2.0.1](https://github.com/AIEraDev/clypra-studio/compare/v2.0.0...v2.0.1) (2026-06-29)

### Bug Fixes

- **studio:** resolve TypeScript errors in PixiRenderBackend ([1b83443](https://github.com/AIEraDev/clypra-studio/commit/1b8344380ca79dcd0aea3b427ddd850b55452ce0))

# [2.0.0](https://github.com/AIEraDev/clypra-studio/compare/v1.29.0...v2.0.0) (2026-06-29)

### Features

- **engine:** implement V2 pipeline infrastructure with NodeRegistry, GraphValidator, and NullBackend ([7bd235c](https://github.com/AIEraDev/clypra-studio/commit/7bd235c9cc9a0972b80db0fb1bd81d1c25127b82))

### BREAKING CHANGES

- **engine:** ProjectCompiler.compile() now accepts optional NodeRegistry parameter

# [1.29.0](https://github.com/AIEraDev/clypra-studio/compare/v1.28.2...v1.29.0) (2026-06-29)

### Bug Fixes

- force PixiJS render for static images after parameter updates ([b52866a](https://github.com/AIEraDev/clypra-studio/commit/b52866a7c6dbbfe4ae466842dc71e28764a57de7))
- handle image source without setImageSource for v1.28.2 ([5756f7f](https://github.com/AIEraDev/clypra-studio/commit/5756f7f835d3b97d9f402f480ca8844d1bb2fbed))

### Features

- **studio:** modularize FilterWorkspace & integrate GPU-accelerated direct sync adjustments and blur filter ([d67036f](https://github.com/AIEraDev/clypra-studio/commit/d67036f34f9e8eca5985dc3f19a98a6c273151af))

## [1.28.2](https://github.com/AIEraDev/clypra-studio/compare/v1.28.1...v1.28.2) (2026-06-29)

### Bug Fixes

- correct uniforms access and cleanup FilterWorkspace ([6c9c227](https://github.com/AIEraDev/clypra-studio/commit/6c9c2274f7c48174983cd9c93ada52b7ba1a7758))

## [1.28.1](https://github.com/AIEraDev/clypra-studio/compare/v1.28.0...v1.28.1) (2026-06-29)

### Bug Fixes

- create separate texture instances for base and filtered sprites ([3e2dfdb](https://github.com/AIEraDev/clypra-studio/commit/3e2dfdbe5f1eaae7f4cd35b73cb46065d9db8b9d))
- **filter:** correct PixiJS renderer type detection from string to enum ([43fb8d6](https://github.com/AIEraDev/clypra-studio/commit/43fb8d6b7485c411ebdf4bc1d4cebbc748f62563))
- **FilterWorkspace:** correct sprite layering and mask logic for PixiJS filters ([f1ed7e4](https://github.com/AIEraDev/clypra-studio/commit/f1ed7e49bad7205eba873705151b43ec057c2060))
- **FilterWorkspace:** ensure video source loads before creating texture ([c2d7af6](https://github.com/AIEraDev/clypra-studio/commit/c2d7af6bdc5f0d08aca0999b6bef21f4848bb2c8))
- **FilterWorkspace:** force VideoSource frame update for paused videos ([c9a8bff](https://github.com/AIEraDev/clypra-studio/commit/c9a8bfff35d72e0cbeb7a8d7f891efa608bddc65))
- **FilterWorkspace:** load textures before adding sprites to stage ([b1cac9e](https://github.com/AIEraDev/clypra-studio/commit/b1cac9ecbb8e27bb0471171659a33b41fc23694a))
- **FilterWorkspace:** prevent double stage.addChild and set dimensions after texture load ([4023c33](https://github.com/AIEraDev/clypra-studio/commit/4023c33aecea0c21b172f714aa1935af6617fa09))

# [1.28.0](https://github.com/AIEraDev/clypra-studio/compare/v1.27.0...v1.28.0) (2026-06-28)

### Features

- **engine:** add cinematic effects library ([e923832](https://github.com/AIEraDev/clypra-studio/commit/e9238328995152aa566eb36c6f2c9166a7108180))
- **engine:** add distortion effects library ([5032a90](https://github.com/AIEraDev/clypra-studio/commit/5032a90f142cf0c452631574eaa48a4324a4d8dc))
- **engine:** add glitch effects library ([f3130a8](https://github.com/AIEraDev/clypra-studio/commit/f3130a8c30d7ec568a2e7653fd5722605e8c5515))
- **engine:** add light effects library ([995703f](https://github.com/AIEraDev/clypra-studio/commit/995703fc9c0d1f20799d1136ee148c7708f45199))
- **engine:** add PixiJS rendering architecture ([451dc16](https://github.com/AIEraDev/clypra-studio/commit/451dc16d6c47eefb588fe6fafb88219a5a3af19a))
- **engine:** add stylization effects library ([2a5fc93](https://github.com/AIEraDev/clypra-studio/commit/2a5fc93e756fc0c2b1455ebb484ab9bdd2a280aa))
- **engine:** expand effects registry with 37 new PixiJS effects ([0a45e86](https://github.com/AIEraDev/clypra-studio/commit/0a45e862f4271ae0f491976eec34d446ef0b3d40))
- **engine:** update video effects API and type definitions ([8de269e](https://github.com/AIEraDev/clypra-studio/commit/8de269eea79a32d636cbe92c3eb584742cc8a171))
- **studio:** add AdminEffectsPanel for effect library management ([95f3b7f](https://github.com/AIEraDev/clypra-studio/commit/95f3b7f36170040129c7fd13d1d5d58caa093576))
- **studio:** add AI-powered custom effect generator ([d732ff9](https://github.com/AIEraDev/clypra-studio/commit/d732ff95cba58f9e810195f758f109399b5e99e6))
- **studio:** add EffectGraphSandbox for testing effect compositions ([c2dfe56](https://github.com/AIEraDev/clypra-studio/commit/c2dfe5616d42993819462dfc5e206a1db9533988))
- **studio:** enhance body, filter, and transition workspaces with PixiJS support ([ef2637b](https://github.com/AIEraDev/clypra-studio/commit/ef2637b233d12dae18d8bb9d563fbdf9ea49ede7))
- **studio:** enhance EffectParameterEditor with advanced controls ([f536798](https://github.com/AIEraDev/clypra-studio/commit/f536798920b7bc9c9390fef07480050956c6cc3a))
- **studio:** major overhaul of VideoEffectWorkspace with PixiJS integration ([2d9de05](https://github.com/AIEraDev/clypra-studio/commit/2d9de056d39811d4aa67931e30adcfd24a8d75eb))
- **studio:** update routing and navigation for new effect features ([c25b488](https://github.com/AIEraDev/clypra-studio/commit/c25b488601746bfb2c59bc957dee7525c3d590d0))
- update to use @clypra/engine@1.27.0 with subpath exports ([90b1c01](https://github.com/AIEraDev/clypra-studio/commit/90b1c012816673716c38cafde59e1eeee2ac0c4c))

# [1.27.0](https://github.com/AIEraDev/clypra-studio/compare/v1.26.0...v1.27.0) (2026-06-23)

### Features

- **engine:** add subpath exports for transitions, videoEffects, and textEffects modules ([7c53489](https://github.com/AIEraDev/clypra-studio/commit/7c534899fd96be71a64c59bd28770aebe6bcb9ea))

# [1.26.0](https://github.com/AIEraDev/clypra-studio/compare/v1.25.0...v1.26.0) (2026-06-23)

### Bug Fixes

- remove not needed message ([6c40970](https://github.com/AIEraDev/clypra-studio/commit/6c4097042e330580cea6ffc713fb4ad887f68dc6))
- set published to false by default in transition upload ([4245538](https://github.com/AIEraDev/clypra-studio/commit/4245538a56b6b31537593248f39ab00ea1c2a836))

### Features

- add admin transitions management UI with publish/unpublish controls ([433719d](https://github.com/AIEraDev/clypra-studio/commit/433719dc1705c48b373a3875a26797dd2fbd92c4))
- add WebM preview generation for transitions ([d9fb501](https://github.com/AIEraDev/clypra-studio/commit/d9fb501aed290cb9eb2fb19e9f8018cca91810c0))
- **engine:** separate transitions module with preset library ([5796690](https://github.com/AIEraDev/clypra-studio/commit/5796690be9ff69b290c05fcb61d0ab8d14025062))

# [1.25.0](https://github.com/AIEraDev/clypra-studio/compare/v1.24.0...v1.25.0) (2026-06-22)

### Bug Fixes

- **stickers:** check isGeneratingPreview in publish button disabled state ([c17c0a2](https://github.com/AIEraDev/clypra-studio/commit/c17c0a252cc7cad6261325bcb57ce2e4d5a30b3d))
- **stickers:** execute preview recording loop sequentially to prevent cpu lock ([d0e1529](https://github.com/AIEraDev/clypra-studio/commit/d0e1529da0406b8074911f99bb07c12825f12b8b))
- **stickers:** render preview video using lottie-web canvas ([b5af843](https://github.com/AIEraDev/clypra-studio/commit/b5af843f28c43deaac43cd44808b835d56a678d5))

### Features

- add .webm preview video generation for stickers ([00dbc0a](https://github.com/AIEraDev/clypra-studio/commit/00dbc0a94472be76ac915a5451f9e5d3be245411))
- add Transition Lab workspace ([d429a41](https://github.com/AIEraDev/clypra-studio/commit/d429a41c5a8e4a8746754441b1246fa3cfec48cc))
- completely remove WebM preview generation and layout, restricting to GIF only ([bb7e1e1](https://github.com/AIEraDev/clypra-studio/commit/bb7e1e1abe15e6bb9fba9d34ee9758c07d649eb2))
- **studio:** add AI generation and R2 publishing to Body and Video workspaces ([980374f](https://github.com/AIEraDev/clypra-studio/commit/980374ffb86ad0ced1bd488f05df579468584b53))
- support manual GIF preview uploading in StickerPublishPanel ([96968fc](https://github.com/AIEraDev/clypra-studio/commit/96968fc5cbf1fcf3d8ccdee4ede2659123349a1e))

# [1.24.0](https://github.com/AIEraDev/clypra-studio/compare/v1.23.0...v1.24.0) (2026-06-20)

### Bug Fixes

- generate filter preview thumbnail with full filtering applied (no split comparison) ([0f93bb8](https://github.com/AIEraDev/clypra-studio/commit/0f93bb861b3d4918bb25ba0042049b013d805db0))

### Features

- implement global admin-only asset publishing and filter thumbnails fallback uploads ([e3ffe32](https://github.com/AIEraDev/clypra-studio/commit/e3ffe329de69cf1218ce7de345493c558f6547f2))
- implement R2 publishing for filters and fix workspace height overflow layout bugs ([99d20aa](https://github.com/AIEraDev/clypra-studio/commit/99d20aafbc93f6fbb553f37c4523dfc944cc7620))
- increase captured preview frame resolution to 1080p for ultra high quality previews ([4e877c2](https://github.com/AIEraDev/clypra-studio/commit/4e877c20564c0ea4294f47402b02cb1b78b6f172))
- split filter R2 index and asset JSON files and support creator attribution inputs ([39190fc](https://github.com/AIEraDev/clypra-studio/commit/39190fcd24d07d09d50f8daf2cbb600fa729d90f))
- **studio:** add frame adjustment slider to select lottie sticker thumbnail ([bc33558](https://github.com/AIEraDev/clypra-studio/commit/bc335588be5d3bd57f272e3d66d21dce69a26bb2))
- **studio:** enhance sticker upload with lottie preview and thumbnail extraction ([146a16e](https://github.com/AIEraDev/clypra-studio/commit/146a16e0c775e9b08e37f4b7e586370756924ec5))

# [1.23.0](https://github.com/AIEraDev/clypra-studio/compare/v1.22.0...v1.23.0) (2026-06-20)

### Features

- **templates:** add skipClear option to drawFrame in TemplateRenderer ([d893108](https://github.com/AIEraDev/clypra-studio/commit/d893108598c678d00ba0fc7f4e50d627cf8e0c9f))
- universally enforce transparent checkerboard for text templates and support alpha in WebM preview/export ([5531e88](https://github.com/AIEraDev/clypra-studio/commit/5531e886f2eabce63b091310d7e281c9fd71cfe4))

# [1.22.0](https://github.com/AIEraDev/clypra-studio/compare/v1.21.0...v1.22.0) (2026-06-19)

### Features

- **admin:** add admin cache purging settings dashboard in clypra-studio ([f316096](https://github.com/AIEraDev/clypra-studio/commit/f316096e2d006c374126f25a696d252099696847))
- **studio:** add direct publish button for unpublished templates in API load panel ([a24616c](https://github.com/AIEraDev/clypra-studio/commit/a24616cca2f3dd19c832f21abaaf4c6aa0ed2e68))
- **templates:** support content scaling and bounds centering in TemplateRenderer ([be88867](https://github.com/AIEraDev/clypra-studio/commit/be88867cbea5acd6f98c104b4a6b605f2003c795))

# [1.21.0](https://github.com/AIEraDev/clypra-studio/compare/v1.20.0...v1.21.0) (2026-06-19)

### Features

- **engine:** track resolved layouts & update studio workspace UI for auto width/height ([7fcc56a](https://github.com/AIEraDev/clypra-studio/commit/7fcc56afc6d8e655cd39539b29699f7c98b3c5d8))

# [1.20.0](https://github.com/AIEraDev/clypra-studio/compare/v1.19.1...v1.20.0) (2026-06-19)

### Features

- **engine:** v1.19.2 — width/height "auto" for TemplateTextLayer ([bbaf14c](https://github.com/AIEraDev/clypra-studio/commit/bbaf14c801e2115fcba044fa4b587d6c97621fff))

## [1.19.1](https://github.com/AIEraDev/clypra-studio/compare/v1.19.0...v1.19.1) (2026-06-19)

### Bug Fixes

- **engine:** v1.19.1 — always clip text to panel bounds with fixed width/height ([d7ab27a](https://github.com/AIEraDev/clypra-studio/commit/d7ab27a144b4c51e12789e4b894ec813eb600a3d))

# [1.19.0](https://github.com/AIEraDev/clypra-studio/compare/v1.18.2...v1.19.0) (2026-06-19)

### Bug Fixes

- font size, padding and all property inputs not applying — stale closure ([c7ca6a7](https://github.com/AIEraDev/clypra-studio/commit/c7ca6a7076e99f686ed69e490bfa5d32463b1068))
- padding inputs not applying — stale closure overwrites ([0c59913](https://github.com/AIEraDev/clypra-studio/commit/0c59913a0ce9f9d7d18d94cacddcc06a4c098fc7))

### Features

- **engine:** v1.19.0 — per-side padding, border-box layout, precise vertical alignment ([b6eb989](https://github.com/AIEraDev/clypra-studio/commit/b6eb989b83cd01f938e76ec4459aacf45782e08d))

## [1.18.2](https://github.com/AIEraDev/clypra-studio/compare/v1.18.1...v1.18.2) (2026-06-19)

### Bug Fixes

- professional vertical alignment using real font metrics (actualBoundingBoxAscent/Descent) ([b0b6c90](https://github.com/AIEraDev/clypra-studio/commit/b0b6c908ba9d121dc1353c849318750d7cde0a25))

## [1.18.1](https://github.com/AIEraDev/clypra-studio/compare/v1.18.0...v1.18.1) (2026-06-19)

### Bug Fixes

- switch text layer renderer to border-box sizing ([c188fc6](https://github.com/AIEraDev/clypra-studio/commit/c188fc6dcf39f8fe84a024564c714e8e5e5db561))

# [1.18.0](https://github.com/AIEraDev/clypra-studio/compare/v1.17.0...v1.18.0) (2026-06-19)

### Features

- per-side padding controls (paddingTop/Right/Bottom/Left) for text layers ([aefb946](https://github.com/AIEraDev/clypra-studio/commit/aefb946549abf44da88a967fec71b6c9eb766968))

# [1.17.0](https://github.com/AIEraDev/clypra-studio/compare/v1.16.0...v1.17.0) (2026-06-19)

### Features

- vertical alignment, creator credits UI, thin manifests, moderation controls in Studio ([e3d8e21](https://github.com/AIEraDev/clypra-studio/commit/e3d8e215fb33ed573961f8a0e45d3c443440f491))

# [1.16.0](https://github.com/AIEraDev/clypra-studio/compare/v1.15.1...v1.16.0) (2026-06-19)

### Bug Fixes

- compute template crop rect at mid-duration to resolve empty bounding box at frame 0 ([65dd0a8](https://github.com/AIEraDev/clypra-studio/commit/65dd0a87710db70d4fb83cd1df7834cc1e28fe25))

### Features

- auto-generate template ID in kebab-case when template name changes ([e238c54](https://github.com/AIEraDev/clypra-studio/commit/e238c540170b6f82d6b242db5acb28d1a38f8ef4))
- crop template WebM/PNG exports and add Download PNG button ([c23b0db](https://github.com/AIEraDev/clypra-studio/commit/c23b0db8a419b870677577bfbe2b2e5ab10a754c))
- implement text overflow handling strategies (wrap, shrink, expand-panel, clip) in template renderer ([a177340](https://github.com/AIEraDev/clypra-studio/commit/a177340809fafed17a1c38a15b345c757601acc6))
- publish template directly to clypra-api without requiring local R2 credentials configuration ([cd5d7f2](https://github.com/AIEraDev/clypra-studio/commit/cd5d7f25b12d0badb2252a22c48ae5dcd4cb2661))
- **studio:** support text template video preview and auto-refresh thumbnail frame ([d5ac6f7](https://github.com/AIEraDev/clypra-studio/commit/d5ac6f7c8c1eafaccedafb2c5648380431297692))

## [1.15.1](https://github.com/AIEraDev/clypra-studio/compare/v1.15.0...v1.15.1) (2026-06-19)

### Bug Fixes

- resolve WebM export stuttering and type errors ([965ec40](https://github.com/AIEraDev/clypra-studio/commit/965ec40b2f4a6f106659163e9d2694302eba2e33))

# [1.15.0](https://github.com/AIEraDev/clypra-studio/compare/v1.14.1...v1.15.0) (2026-06-19)

### Features

- add preview video generation and improved canvas display ([0c938da](https://github.com/AIEraDev/clypra-studio/commit/0c938dabc63531ef2de40d0644a843659a256dac))
- add preview video generation for text template publishing ([ed97a10](https://github.com/AIEraDev/clypra-studio/commit/ed97a10715deab40419533ed63925536764cdb55))
- center all text layers on canvas by default ([43bfbab](https://github.com/AIEraDev/clypra-studio/commit/43bfbab5b959e59519ca86aaf033b8faaab24fa6))

## [1.14.1](https://github.com/AIEraDev/clypra-studio/compare/v1.14.0...v1.14.1) (2026-06-19)

### Bug Fixes

- apply layer opacity to background panel rendering ([8f65bda](https://github.com/AIEraDev/clypra-studio/commit/8f65bda175483a3abc6515bfc8d2a97722e7641b))

# [1.14.0](https://github.com/AIEraDev/clypra-studio/compare/v1.13.0...v1.14.0) (2026-06-19)

### Features

- add opacity property for layer display/visibility animation ([73925e9](https://github.com/AIEraDev/clypra-studio/commit/73925e91048606fa12598b3a73e7f9991c728dcd))
- implement keyframe editor UI for property animation ([cec4419](https://github.com/AIEraDev/clypra-studio/commit/cec44199338cb50ba88bca9e32e381c4c003375d))

# [1.13.0](https://github.com/AIEraDev/clypra-studio/compare/v1.12.0...v1.13.0) (2026-06-19)

### Bug Fixes

- add 'none' role option and sync test inputs with layer content ([22420a5](https://github.com/AIEraDev/clypra-studio/commit/22420a53d9f1149b6601a3e076fe7d3adda903bc))
- update branding from Clypra Studio to Text Templates ([71aedd0](https://github.com/AIEraDev/clypra-studio/commit/71aedd040aec5308e24e6cad3e0272dcb7990e64))

### Features

- add fontWeight and background panel properties with border support ([9046d00](https://github.com/AIEraDev/clypra-studio/commit/9046d000302992e302f8eb2bed8f778e16678d38))

# [1.12.0](https://github.com/AIEraDev/clypra-studio/compare/v1.11.0...v1.12.0) (2026-06-19)

### Features

- enhance studio workspace and template publishing ([d252827](https://github.com/AIEraDev/clypra-studio/commit/d252827294cece1e39ae82fd0dd57e5ee15e35b4))

# [1.11.0](https://github.com/AIEraDev/clypra-studio/compare/v1.10.1...v1.11.0) (2026-06-19)

### Bug Fixes

- use relative base path in Vite for portable asset loading ([e1eb44a](https://github.com/AIEraDev/clypra-studio/commit/e1eb44a976cdab74074448e47425295847a24332))

### Features

- login modal UI and global fetch interceptor auth integration ([698a6ec](https://github.com/AIEraDev/clypra-studio/commit/698a6ecc644e23de7ffbb5c3d440a6a5de291a61))
- render BodyEffectWorkspace in App ([93d03c7](https://github.com/AIEraDev/clypra-studio/commit/93d03c7a2e07fa88b06eb619d16b463bc21eacfa))
- restrict LoginModal to Sign In only, removing register UI ([4860d76](https://github.com/AIEraDev/clypra-studio/commit/4860d76e78ad295fc57cb025f4f6a3b6ef02102b))

## [1.10.1](https://github.com/AIEraDev/clypra-studio/compare/v1.10.0...v1.10.1) (2026-06-18)

### Bug Fixes

- remove orphaned async code in TemplateWorkspace ([a2980f8](https://github.com/AIEraDev/clypra-studio/commit/a2980f89656919474cc22911c0b4dc49216fdc9c))
- resolve all TypeScript linting errors ([38564a6](https://github.com/AIEraDev/clypra-studio/commit/38564a6a2d8ca843c548200c4f21dc8d78033266))
- update audio publishing to use API endpoint instead of direct R2 upload ([5745152](https://github.com/AIEraDev/clypra-studio/commit/57451524b322881deb77792d3f269d09f983cbfa))

# [1.10.0](https://github.com/AIEraDev/clypra-studio/compare/v1.9.0...v1.10.0) (2026-06-17)

### Bug Fixes

- Clear validation errors after AI generation and update AI endpoint URL ([60b224c](https://github.com/AIEraDev/clypra-studio/commit/60b224c996e314fd780932748248778bd3b076b3))
- Enable text selection in all inputs globally ([23fc78c](https://github.com/AIEraDev/clypra-studio/commit/23fc78cbeb0ca42cb0ecb23fbadce3b7352a2249))
- Prevent form reset when config changes after AI generation ([ebb03c0](https://github.com/AIEraDev/clypra-studio/commit/ebb03c073920978b81363218caaf0297052ae608))
- Remove select-none from modal overlays and improve input detection ([2879b73](https://github.com/AIEraDev/clypra-studio/commit/2879b73da2e07561916ea3b18483b9b475405acb))
- Resolve infinite loop preventing input in PublishEffectModal ([6851e52](https://github.com/AIEraDev/clypra-studio/commit/6851e524269f591ac234a73e91653a2c2e1125ca))

### Features

- add R2 direct publishing implementation ([ac55017](https://github.com/AIEraDev/clypra-studio/commit/ac550172b2c24a8f3cbc175328a9797a8b662d32))
- **clypra-engine:** implement dynamic google font injection and fallback weight checking for fontLoader ([128e5ce](https://github.com/AIEraDev/clypra-studio/commit/128e5cedb9d8e62a7f0289a69e8cf0f4c2006ef4))

# [1.9.0](https://github.com/AIEraDev/clypra-studio/compare/v1.8.0...v1.9.0) (2026-06-16)

### Features

- **engine:** add fire and particle light effects ([ebea313](https://github.com/AIEraDev/clypra-studio/commit/ebea3136bd94bb4b45cfbcda82ff68d6a9e30e6f))

# [1.8.0](https://github.com/AIEraDev/clypra-studio/compare/v1.7.0...v1.8.0) (2026-06-16)

### Features

- add category support for renderer-based effects API ([1c90b67](https://github.com/AIEraDev/clypra-studio/commit/1c90b67054f46027df9680de36acc47c64ba73aa))

# [1.7.0](https://github.com/AIEraDev/clypra-studio/compare/v1.6.0...v1.7.0) (2026-06-16)

### Bug Fixes

- render video frame on load and when seeking while paused ([5b5693c](https://github.com/AIEraDev/clypra-studio/commit/5b5693c0e5853d1fef0511cd02bfa9a267215bed))

### Features

- add renderer-based effects system with 11 effects ([d4bc9d1](https://github.com/AIEraDev/clypra-studio/commit/d4bc9d12d6c3decd32fce9ec6e37aa9f864ae263))

# [1.6.0](https://github.com/AIEraDev/clypra-studio/compare/v1.5.0...v1.6.0) (2026-06-16)

### Bug Fixes

- adjusted layout ([f1bfca8](https://github.com/AIEraDev/clypra-studio/commit/f1bfca8ab1111d8fae18171040cd76dc508a4631))
- correct string quote mismatch in useGitHubPublish ([66072c0](https://github.com/AIEraDev/clypra-studio/commit/66072c03b73f17694772484e4a10b2f88574cea9))
- ensure AI-generated effect params are always populated ([52fe912](https://github.com/AIEraDev/clypra-studio/commit/52fe9126472be947e3d91c69d30a468ff4d71bc4))
- resolve horizontal layout overflow on landing page ([0e362d5](https://github.com/AIEraDev/clypra-studio/commit/0e362d5b9ad65ed721d6397e4d7c8dc084e09c8a))
- resolve mobile layout overflow in navigation header ([b1f7498](https://github.com/AIEraDev/clypra-studio/commit/b1f74988039f214d51c4a8637803a6442126bad0))
- use Git Data API for large animated sticker files ([433f051](https://github.com/AIEraDev/clypra-studio/commit/433f051777fc6601c1138a6201823b0623b9fa4b))

### Features

- add creator section and social links to showcase page ([45a56ca](https://github.com/AIEraDev/clypra-studio/commit/45a56caac08c236c6ad99822fd54e1941a003fdc))
- add dynamic animations to all video effect previews ([683e55c](https://github.com/AIEraDev/clypra-studio/commit/683e55cbdb62cc5e5e1f6f046c3ed9cd60e282d7))
- add video effect preset publishing system ([4ac7f4a](https://github.com/AIEraDev/clypra-studio/commit/4ac7f4aff85c101dcccc85c552f43b2c77e6fd66))
- add WebM export for effect preview canvas ([4b82965](https://github.com/AIEraDev/clypra-studio/commit/4b82965c734f8c9922839988532f734aa075a42c))
- integrate video effects workspace into Studio navigation ([1947815](https://github.com/AIEraDev/clypra-studio/commit/1947815211eb3f3843d6c51ce11e94fd2a5edac7))

# [1.5.0](https://github.com/AIEraDev/clypra-studio/compare/v1.4.0...v1.5.0) (2026-06-12)

### Bug Fixes

- add validation and improve GIF auto-switch logic ([643563f](https://github.com/AIEraDev/clypra-studio/commit/643563f12326825557b323f01e56aa7998a3f4aa))
- allow GIF thumbnails for all sticker formats ([f5dc469](https://github.com/AIEraDev/clypra-studio/commit/f5dc469b40bb02d024a270e952bf62ad9b7650e3))
- auto-switch to GIF format when GIF image is uploaded ([aaf98bc](https://github.com/AIEraDev/clypra-studio/commit/aaf98bc0d045975942bb8677b24fb9aaeafd00b7))
- improve GIF export with better frame capture and debugging ([d7eb50c](https://github.com/AIEraDev/clypra-studio/commit/d7eb50c57d0fc3c567ac30ec4f58093f4575cf88))
- remove unused isMp4ExportSupported import ([ade6d31](https://github.com/AIEraDev/clypra-studio/commit/ade6d31c518eb597e2a50ec33c3255cb53940b52))
- respect user's format selection, don't auto-switch ([e836c27](https://github.com/AIEraDev/clypra-studio/commit/e836c27041be1857396a07d32c46fbaa7d871533))

### Features

- add GIF export for Lottie animations ([ee29b94](https://github.com/AIEraDev/clypra-studio/commit/ee29b9447dcffbcaaa1d33fd15fda0eae3c5ea78))
- add GIF support to sticker image file upload ([66ccfd2](https://github.com/AIEraDev/clypra-studio/commit/66ccfd264a0028866a1824491c4b934e2195fde1))
- add MP4 export for Lottie animations ([0e7233e](https://github.com/AIEraDev/clypra-studio/commit/0e7233e9a51b8043384b79d5a8862da5c40cbba2))
- add video effects and filters categories to studio publishing modal ([b4b5b40](https://github.com/AIEraDev/clypra-studio/commit/b4b5b40831fb0c41df731b2c2ffd23f4e5b3f235))

# [1.4.0](https://github.com/AIEraDev/clypra-studio/compare/v1.3.0...v1.4.0) (2026-06-06)

### Bug Fixes

- **engine:** Fix text effect property mapping and add runtime validation ([943871c](https://github.com/AIEraDev/clypra-studio/commit/943871cf6275cf276563c5b4e385134fc4b17909))

### Features

- updated bounding box for type definition ([a3b6528](https://github.com/AIEraDev/clypra-studio/commit/a3b65282dbe36a1c3389dd3d069e81a279159f2a))

## [1.3.1](https://github.com/AIEraDev/clypra-studio/compare/v1.3.0...v1.3.1) (2026-06-06)

### Bug Fixes

- **engine:** Fix text effect property mapping and add runtime validation ([943871c](https://github.com/AIEraDev/clypra-studio/commit/943871cf6275cf276563c5b4e385134fc4b17909))

# [1.3.0](https://github.com/AIEraDev/clypra-studio/compare/v1.2.1...v1.3.0) (2026-06-06)

### Features

- add programmatic update APIs and TextEffectBuilder to clypra-engine ([68595cb](https://github.com/AIEraDev/clypra-studio/commit/68595cbfadcea6707d38f9dce2fd1dbe42b20546))

## [1.2.1](https://github.com/AIEraDev/clypra-studio/compare/v1.2.0...v1.2.1) (2026-06-06)

### Bug Fixes

- vertical centering layout logic in engine, inkBrush, and code generator; add text layout unit tests ([6ecde27](https://github.com/AIEraDev/clypra-studio/commit/6ecde279c1e1cab07b586d2abc6e1f1d5977a6b5))

# [1.2.0](https://github.com/AIEraDev/clypra-studio/compare/v1.1.2...v1.2.0) (2026-06-04)

### Bug Fixes

- add ctx.filter support check with shadow fallback for bevel and stroke blur ([7a62053](https://github.com/AIEraDev/clypra-studio/commit/7a620537f987fc10186493f3a4f7069378cdbd5e))

### Features

- improve AI effect naming with category enforcement ([21b81e1](https://github.com/AIEraDev/clypra-studio/commit/21b81e13cecb3720ca6e75298345041c8221526c))

## [1.1.2](https://github.com/AIEraDev/clypra-studio/compare/v1.1.1...v1.1.2) (2026-06-04)

### Bug Fixes

- **engine:** unify platform canvas pooling and evaluator compositor fallback ([c940a80](https://github.com/AIEraDev/clypra-studio/commit/c940a80e4a0b84b0a9404930f1d332eac5d1cf80))

## [1.1.1](https://github.com/AIEraDev/clypra-studio/compare/v1.1.0...v1.1.1) (2026-06-03)

### Bug Fixes

- **engine:** 6 concrete bugs across platform, fontLoader, evaluate, textLayout, renderer ([7c13478](https://github.com/AIEraDev/clypra-studio/commit/7c13478bfe158c8698e90a94715f9cec594285df)), closes [#000000](https://github.com/AIEraDev/clypra-studio/issues/000000)

# [1.1.0](https://github.com/AIEraDev/clypra-studio/compare/v1.0.2...v1.1.0) (2026-06-03)

### Bug Fixes

- **studio:** toolbar overflow-auto with hidden scrollbar for narrow viewports ([72dad2d](https://github.com/AIEraDev/clypra-studio/commit/72dad2d76f38f279aac97c5be621a64dcd390a9b))

### Features

- **engine:** platform capability module, canvas-utils, and canonical constants ([ae15cd6](https://github.com/AIEraDev/clypra-studio/commit/ae15cd6bac584f2f6ce9b3d5cc0a6ccd3cfd1a32))
- **studio:** redesign preview canvas toolbar — single row, compact platform dropdown ([92725a9](https://github.com/AIEraDev/clypra-studio/commit/92725a9d5cde6356c57d23f0d6f97f3fa45e2d97))

## [1.0.2](https://github.com/AIEraDev/clypra-studio/compare/v1.0.1...v1.0.2) (2026-06-02)

### Bug Fixes

- **engine:** add README.md for npm package page ([4cf12a7](https://github.com/AIEraDev/clypra-studio/commit/4cf12a7c0c0a980f60af517f075879507645b7b6))
- **engine:** trigger release to publish readme ([5c09b52](https://github.com/AIEraDev/clypra-studio/commit/5c09b523a638bec7b9a63f7d417a4bceb20e572e))
- **engine:** trigger release to publish readme ([c8cd1bd](https://github.com/AIEraDev/clypra-studio/commit/c8cd1bd7ea1ca1f833e3e27465a79e0e6fa360f2))

## [1.0.1](https://github.com/AIEraDev/clypra-studio/compare/v1.0.0...v1.0.1) (2026-06-02)

### Bug Fixes

- **deploy:** add root vercel.json with correct outputDirectory for monorepo ([c2b5db6](https://github.com/AIEraDev/clypra-studio/commit/c2b5db6ea0186083ed6148fa4763e7f5694c1020))
- **engine:** expose all missing exports — lottieEditor, lottieParser, InkBrushEngine ([ad8b1d6](https://github.com/AIEraDev/clypra-studio/commit/ad8b1d6071a94b7ff42217f7602e5c492b173ead))

# 1.0.0 (2026-06-02)

### Bug Fixes

- adjust global font size percentage ([9a440e9](https://github.com/AIEraDev/clypra-studio/commit/9a440e9cd702f67089875c72e8e4f56da0ab2a4f))
- **ci:** restore credentials in checkout so semantic-release can detect branch state ([faf2b80](https://github.com/AIEraDev/clypra-studio/commit/faf2b8027f10c46b6f347d0de3700f03fc25f912))
- **ci:** switch @clypra/engine build from tsc to tsup, fix publish workflow ([600a885](https://github.com/AIEraDev/clypra-studio/commit/600a8858caedeb84160721ebb2f35b38aa68d0d8))
- cleanup ddefault presets ([eeeb909](https://github.com/AIEraDev/clypra-studio/commit/eeeb909d4994e6a8b048ba23a32357d6fa5d3d1f))
- clear canvas before render in evaluate.ts fast path — eliminates ghost frame bleed-through ([e091234](https://github.com/AIEraDev/clypra-studio/commit/e09123462c016c15cff4275b970db94158ff3d4c))
- clip canvas overflow on preview card + default ?q=templates on load ([4107549](https://github.com/AIEraDev/clypra-studio/commit/4107549b55980f4698c9eb19a687030c153bbaf4))
- correct canvas stage dimensions to match CSS-scaled footprint, eliminates ghost overlap ([4e6356f](https://github.com/AIEraDev/clypra-studio/commit/4e6356f8cba21bb8a0c2ad440131c7dd08006a01))
- **engine:** add package header comment to index.ts, trigger v1.0.0 publish ([d7da31e](https://github.com/AIEraDev/clypra-studio/commit/d7da31e7fe9579df4a21ef6813cafdb918ed2cab))
- **engine:** add repository field to package.json for npm provenance validation ([f064228](https://github.com/AIEraDev/clypra-studio/commit/f064228971cc5da957af5af5aa0db45b931f1fcb))
- **engine:** retrigger publish with refreshed NPM_TOKEN ([d8e1e90](https://github.com/AIEraDev/clypra-studio/commit/d8e1e90211771e1ec3c035f76782ee99ce2512ea))
- **engine:** trigger publish after npm 2FA set to authorization-only ([bf3a148](https://github.com/AIEraDev/clypra-studio/commit/bf3a1484c87fa8a9a4f56e2e49bef8a261648441))
- preserve workspace mode URLs on page reload ([2a69b83](https://github.com/AIEraDev/clypra-studio/commit/2a69b83faedb931e8f35fdcf1532376e27fc07d4))
- prevent API Key button text from wrapping ([3f92d27](https://github.com/AIEraDev/clypra-studio/commit/3f92d27bd07f7d25d63a6b7018ee9a3b1cb9f7ac))
- remove default blank preset to no stroke ([55f64ab](https://github.com/AIEraDev/clypra-studio/commit/55f64ab1753c829d8deecd7383b282d7d8550696))
- target public npm registry in publish workflow ([82a599f](https://github.com/AIEraDev/clypra-studio/commit/82a599f8b811e3d1536a80b06e32e8a150ac2ce6))
- update Vercel routing for SPA client-side navigation ([78d620f](https://github.com/AIEraDev/clypra-studio/commit/78d620ff4f0964e3e3b1cc7a4ff7615f4bac957f))
- use document.fonts.load() per-font to eliminate font family race condition ([9ae9d30](https://github.com/AIEraDev/clypra-studio/commit/9ae9d30393440345bd2f6a75878bbe1cef7e08b5))

### Features

- add Gemini API Key button to header and Lottie page ([e3796b7](https://github.com/AIEraDev/clypra-studio/commit/e3796b77d6605bc5396578f31dd147534ce151a7))
- add landing page, assets, and routing ([63db1b1](https://github.com/AIEraDev/clypra-studio/commit/63db1b1e0115c38a569760a82c16a6bc3038957f))
- add professional branding to studio header and update SEO ([493fe98](https://github.com/AIEraDev/clypra-studio/commit/493fe989da737b08a8cf1df98faf52d7a0e08ecd))
- Add template publishing and Lottie editing capabilities ([1b27c52](https://github.com/AIEraDev/clypra-studio/commit/1b27c52b5c6b93a14a6085df80403793331297d6))
- add Vercel Analytics and Speed Insights ([a72a3f5](https://github.com/AIEraDev/clypra-studio/commit/a72a3f5b247bc929d2967b822439a152311aa982))
- CapCut-grade Lottie text template system + navigation overhaul ([07edb0e](https://github.com/AIEraDev/clypra-studio/commit/07edb0ecaed3af33717db2a4058014dbab3242be))
- complete layered effect engine roadmap and lab integration ([ca3a0e0](https://github.com/AIEraDev/clypra-studio/commit/ca3a0e035c0d38ee673f4d61847b949c5201b0d5))
- gradient-shaded 3D bevel with AO darkening and specular rim highlight ([baed333](https://github.com/AIEraDev/clypra-studio/commit/baed333c661515c8ae2dd72f6ac51f59842cd8bf))
- implement professional URL-based navigation for workspace modes ([35c3a9a](https://github.com/AIEraDev/clypra-studio/commit/35c3a9a7d8090d9686ceb5d46c36d4e753fd5958))
- initialize Clypra Text Effect Studio application ([f86b5a2](https://github.com/AIEraDev/clypra-studio/commit/f86b5a23d61367544b2b72b01bb7ae519c7d9c03))
- integrate semantic-release for automated versioning and publishing ([e0d7d99](https://github.com/AIEraDev/clypra-studio/commit/e0d7d9940dc505a6b2140fa396b0ba15b84b3430))
- refactor clypra studio to monorepo with @clypra/engine shared package ([6a7196c](https://github.com/AIEraDev/clypra-studio/commit/6a7196c1c56ade3a9943028ecbc7ded473d0e540))
- replace engine class label with Clypra Studio brand badge in preview canvas ([a7ce5c3](https://github.com/AIEraDev/clypra-studio/commit/a7ce5c33fc8e5175187e056d008b53031aa52303))
- restructure categories to align with professional NLE standards ([5a9d602](https://github.com/AIEraDev/clypra-studio/commit/5a9d60235d2f6409c3e134084abb399798449ce4))
- start blank on first load instead of auto-applying first preset ([16cc5c4](https://github.com/AIEraDev/clypra-studio/commit/16cc5c46ca57a8cf0beb8b914dd7a18a9913e267))

# 1.0.0 (2026-06-02)

### Bug Fixes

- adjust global font size percentage ([9a440e9](https://github.com/AIEraDev/clypra-studio/commit/9a440e9cd702f67089875c72e8e4f56da0ab2a4f))
- **ci:** restore credentials in checkout so semantic-release can detect branch state ([faf2b80](https://github.com/AIEraDev/clypra-studio/commit/faf2b8027f10c46b6f347d0de3700f03fc25f912))
- **ci:** switch @clypra/engine build from tsc to tsup, fix publish workflow ([600a885](https://github.com/AIEraDev/clypra-studio/commit/600a8858caedeb84160721ebb2f35b38aa68d0d8))
- cleanup ddefault presets ([eeeb909](https://github.com/AIEraDev/clypra-studio/commit/eeeb909d4994e6a8b048ba23a32357d6fa5d3d1f))
- clear canvas before render in evaluate.ts fast path — eliminates ghost frame bleed-through ([e091234](https://github.com/AIEraDev/clypra-studio/commit/e09123462c016c15cff4275b970db94158ff3d4c))
- clip canvas overflow on preview card + default ?q=templates on load ([4107549](https://github.com/AIEraDev/clypra-studio/commit/4107549b55980f4698c9eb19a687030c153bbaf4))
- correct canvas stage dimensions to match CSS-scaled footprint, eliminates ghost overlap ([4e6356f](https://github.com/AIEraDev/clypra-studio/commit/4e6356f8cba21bb8a0c2ad440131c7dd08006a01))
- **engine:** add package header comment to index.ts, trigger v1.0.0 publish ([d7da31e](https://github.com/AIEraDev/clypra-studio/commit/d7da31e7fe9579df4a21ef6813cafdb918ed2cab))
- **engine:** retrigger publish with refreshed NPM_TOKEN ([d8e1e90](https://github.com/AIEraDev/clypra-studio/commit/d8e1e90211771e1ec3c035f76782ee99ce2512ea))
- **engine:** trigger publish after npm 2FA set to authorization-only ([bf3a148](https://github.com/AIEraDev/clypra-studio/commit/bf3a1484c87fa8a9a4f56e2e49bef8a261648441))
- preserve workspace mode URLs on page reload ([2a69b83](https://github.com/AIEraDev/clypra-studio/commit/2a69b83faedb931e8f35fdcf1532376e27fc07d4))
- prevent API Key button text from wrapping ([3f92d27](https://github.com/AIEraDev/clypra-studio/commit/3f92d27bd07f7d25d63a6b7018ee9a3b1cb9f7ac))
- remove default blank preset to no stroke ([55f64ab](https://github.com/AIEraDev/clypra-studio/commit/55f64ab1753c829d8deecd7383b282d7d8550696))
- target public npm registry in publish workflow ([82a599f](https://github.com/AIEraDev/clypra-studio/commit/82a599f8b811e3d1536a80b06e32e8a150ac2ce6))
- update Vercel routing for SPA client-side navigation ([78d620f](https://github.com/AIEraDev/clypra-studio/commit/78d620ff4f0964e3e3b1cc7a4ff7615f4bac957f))
- use document.fonts.load() per-font to eliminate font family race condition ([9ae9d30](https://github.com/AIEraDev/clypra-studio/commit/9ae9d30393440345bd2f6a75878bbe1cef7e08b5))

### Features

- add Gemini API Key button to header and Lottie page ([e3796b7](https://github.com/AIEraDev/clypra-studio/commit/e3796b77d6605bc5396578f31dd147534ce151a7))
- add landing page, assets, and routing ([63db1b1](https://github.com/AIEraDev/clypra-studio/commit/63db1b1e0115c38a569760a82c16a6bc3038957f))
- add professional branding to studio header and update SEO ([493fe98](https://github.com/AIEraDev/clypra-studio/commit/493fe989da737b08a8cf1df98faf52d7a0e08ecd))
- Add template publishing and Lottie editing capabilities ([1b27c52](https://github.com/AIEraDev/clypra-studio/commit/1b27c52b5c6b93a14a6085df80403793331297d6))
- add Vercel Analytics and Speed Insights ([a72a3f5](https://github.com/AIEraDev/clypra-studio/commit/a72a3f5b247bc929d2967b822439a152311aa982))
- CapCut-grade Lottie text template system + navigation overhaul ([07edb0e](https://github.com/AIEraDev/clypra-studio/commit/07edb0ecaed3af33717db2a4058014dbab3242be))
- complete layered effect engine roadmap and lab integration ([ca3a0e0](https://github.com/AIEraDev/clypra-studio/commit/ca3a0e035c0d38ee673f4d61847b949c5201b0d5))
- gradient-shaded 3D bevel with AO darkening and specular rim highlight ([baed333](https://github.com/AIEraDev/clypra-studio/commit/baed333c661515c8ae2dd72f6ac51f59842cd8bf))
- implement professional URL-based navigation for workspace modes ([35c3a9a](https://github.com/AIEraDev/clypra-studio/commit/35c3a9a7d8090d9686ceb5d46c36d4e753fd5958))
- initialize Clypra Text Effect Studio application ([f86b5a2](https://github.com/AIEraDev/clypra-studio/commit/f86b5a23d61367544b2b72b01bb7ae519c7d9c03))
- integrate semantic-release for automated versioning and publishing ([e0d7d99](https://github.com/AIEraDev/clypra-studio/commit/e0d7d9940dc505a6b2140fa396b0ba15b84b3430))
- refactor clypra studio to monorepo with @clypra/engine shared package ([6a7196c](https://github.com/AIEraDev/clypra-studio/commit/6a7196c1c56ade3a9943028ecbc7ded473d0e540))
- replace engine class label with Clypra Studio brand badge in preview canvas ([a7ce5c3](https://github.com/AIEraDev/clypra-studio/commit/a7ce5c33fc8e5175187e056d008b53031aa52303))
- restructure categories to align with professional NLE standards ([5a9d602](https://github.com/AIEraDev/clypra-studio/commit/5a9d60235d2f6409c3e134084abb399798449ce4))
- start blank on first load instead of auto-applying first preset ([16cc5c4](https://github.com/AIEraDev/clypra-studio/commit/16cc5c46ca57a8cf0beb8b914dd7a18a9913e267))

## [1.0.3](https://github.com/AIEraDev/clypra-studio/compare/v1.0.2...v1.0.3) (2026-06-02)

### Bug Fixes

- **engine:** retrigger publish with refreshed NPM_TOKEN ([d8e1e90](https://github.com/AIEraDev/clypra-studio/commit/d8e1e90211771e1ec3c035f76782ee99ce2512ea))

## [1.0.2](https://github.com/AIEraDev/clypra-studio/compare/v1.0.1...v1.0.2) (2026-06-02)

### Bug Fixes

- **engine:** trigger publish after npm 2FA set to authorization-only ([bf3a148](https://github.com/AIEraDev/clypra-studio/commit/bf3a1484c87fa8a9a4f56e2e49bef8a261648441))

## [1.0.1](https://github.com/AIEraDev/clypra-studio/compare/v1.0.0...v1.0.1) (2026-06-02)

### Bug Fixes

- **ci:** restore credentials in checkout so semantic-release can detect branch state ([faf2b80](https://github.com/AIEraDev/clypra-studio/commit/faf2b8027f10c46b6f347d0de3700f03fc25f912))

# 1.0.0 (2026-06-02)

### Bug Fixes

- adjust global font size percentage ([9a440e9](https://github.com/AIEraDev/clypra-studio/commit/9a440e9cd702f67089875c72e8e4f56da0ab2a4f))
- **ci:** switch @clypra/engine build from tsc to tsup, fix publish workflow ([600a885](https://github.com/AIEraDev/clypra-studio/commit/600a8858caedeb84160721ebb2f35b38aa68d0d8))
- cleanup ddefault presets ([eeeb909](https://github.com/AIEraDev/clypra-studio/commit/eeeb909d4994e6a8b048ba23a32357d6fa5d3d1f))
- clear canvas before render in evaluate.ts fast path — eliminates ghost frame bleed-through ([e091234](https://github.com/AIEraDev/clypra-studio/commit/e09123462c016c15cff4275b970db94158ff3d4c))
- clip canvas overflow on preview card + default ?q=templates on load ([4107549](https://github.com/AIEraDev/clypra-studio/commit/4107549b55980f4698c9eb19a687030c153bbaf4))
- correct canvas stage dimensions to match CSS-scaled footprint, eliminates ghost overlap ([4e6356f](https://github.com/AIEraDev/clypra-studio/commit/4e6356f8cba21bb8a0c2ad440131c7dd08006a01))
- preserve workspace mode URLs on page reload ([2a69b83](https://github.com/AIEraDev/clypra-studio/commit/2a69b83faedb931e8f35fdcf1532376e27fc07d4))
- prevent API Key button text from wrapping ([3f92d27](https://github.com/AIEraDev/clypra-studio/commit/3f92d27bd07f7d25d63a6b7018ee9a3b1cb9f7ac))
- remove default blank preset to no stroke ([55f64ab](https://github.com/AIEraDev/clypra-studio/commit/55f64ab1753c829d8deecd7383b282d7d8550696))
- target public npm registry in publish workflow ([82a599f](https://github.com/AIEraDev/clypra-studio/commit/82a599f8b811e3d1536a80b06e32e8a150ac2ce6))
- update Vercel routing for SPA client-side navigation ([78d620f](https://github.com/AIEraDev/clypra-studio/commit/78d620ff4f0964e3e3b1cc7a4ff7615f4bac957f))
- use document.fonts.load() per-font to eliminate font family race condition ([9ae9d30](https://github.com/AIEraDev/clypra-studio/commit/9ae9d30393440345bd2f6a75878bbe1cef7e08b5))

### Features

- add Gemini API Key button to header and Lottie page ([e3796b7](https://github.com/AIEraDev/clypra-studio/commit/e3796b77d6605bc5396578f31dd147534ce151a7))
- add landing page, assets, and routing ([63db1b1](https://github.com/AIEraDev/clypra-studio/commit/63db1b1e0115c38a569760a82c16a6bc3038957f))
- add professional branding to studio header and update SEO ([493fe98](https://github.com/AIEraDev/clypra-studio/commit/493fe989da737b08a8cf1df98faf52d7a0e08ecd))
- Add template publishing and Lottie editing capabilities ([1b27c52](https://github.com/AIEraDev/clypra-studio/commit/1b27c52b5c6b93a14a6085df80403793331297d6))
- add Vercel Analytics and Speed Insights ([a72a3f5](https://github.com/AIEraDev/clypra-studio/commit/a72a3f5b247bc929d2967b822439a152311aa982))
- CapCut-grade Lottie text template system + navigation overhaul ([07edb0e](https://github.com/AIEraDev/clypra-studio/commit/07edb0ecaed3af33717db2a4058014dbab3242be))
- complete layered effect engine roadmap and lab integration ([ca3a0e0](https://github.com/AIEraDev/clypra-studio/commit/ca3a0e035c0d38ee673f4d61847b949c5201b0d5))
- gradient-shaded 3D bevel with AO darkening and specular rim highlight ([baed333](https://github.com/AIEraDev/clypra-studio/commit/baed333c661515c8ae2dd72f6ac51f59842cd8bf))
- implement professional URL-based navigation for workspace modes ([35c3a9a](https://github.com/AIEraDev/clypra-studio/commit/35c3a9a7d8090d9686ceb5d46c36d4e753fd5958))
- initialize Clypra Text Effect Studio application ([f86b5a2](https://github.com/AIEraDev/clypra-studio/commit/f86b5a23d61367544b2b72b01bb7ae519c7d9c03))
- integrate semantic-release for automated versioning and publishing ([e0d7d99](https://github.com/AIEraDev/clypra-studio/commit/e0d7d9940dc505a6b2140fa396b0ba15b84b3430))
- refactor clypra studio to monorepo with @clypra/engine shared package ([6a7196c](https://github.com/AIEraDev/clypra-studio/commit/6a7196c1c56ade3a9943028ecbc7ded473d0e540))
- replace engine class label with Clypra Studio brand badge in preview canvas ([a7ce5c3](https://github.com/AIEraDev/clypra-studio/commit/a7ce5c33fc8e5175187e056d008b53031aa52303))
- restructure categories to align with professional NLE standards ([5a9d602](https://github.com/AIEraDev/clypra-studio/commit/5a9d60235d2f6409c3e134084abb399798449ce4))
- start blank on first load instead of auto-applying first preset ([16cc5c4](https://github.com/AIEraDev/clypra-studio/commit/16cc5c46ca57a8cf0beb8b914dd7a18a9913e267))
