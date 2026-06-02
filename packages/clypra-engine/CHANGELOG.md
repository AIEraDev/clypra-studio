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
