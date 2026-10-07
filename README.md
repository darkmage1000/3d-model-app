# Meshcraft

A Windows desktop and browser studio for making original low-poly humans, creatures, and world props for videogames. Built with Electron, React, Vite, and Three.js. No backend, account, or API key is required.

## Windows desktop app

For **Windows 10/11, 64-bit**, download `https://github.com/darkmage1000/3d-model-app/releases/download/v1.2.0/Meshcraft-Setup-1.2.0-Windows-x64.exe`, open it, choose an installation folder, and finish the setup. Launch **Meshcraft** from the desktop shortcut or Start menu. The app has its own window and bundled runtime; no browser, Node.js, server, or internet connection is needed to use it.

For a portable folder instead, download `https://github.com/darkmage1000/3d-model-app/releases/download/v1.2.0/Meshcraft-1.2.0-Windows-x64.zip`, extract **all** files into a folder, and open `Meshcraft.exe`. Keep the executable with its companion files. The installer and portable version use the same local desktop profile at `%APPDATA%\Meshcraft`. Saved drafts and collections survive closing the app and updates. Uninstalling preserves this profile. Browser-version collections use separate storage and are not automatically transferred.

**Save GLB** opens a native Save dialog. **Save OBJ + MTL** asks for the OBJ location once and saves both files in that folder. Renaming the OBJ also renames its MTL and updates the material reference. Canceling writes no files. **File → Open exports folder** opens the default Downloads folder; a custom export can be saved elsewhere. Window menus provide standard edit, reload, zoom, and fullscreen shortcuts.

**Updates (version 1.2.0 onward):** Install 1.2.0 once to add the updater. The installed Windows app checks for a stable release after startup. Use **Check for updates** in the top bar or **Help → Check for updates** to check manually. Choose **Download update**, keep working during the download, then choose **Restart to update** and confirm. Closing the app does not install an update automatically. Updates preserve the chosen installation folder, drafts, collections, and settings. Downloads use HTTPS and the published SHA-512 checksum; newer releases include blockmaps for differential downloads where available, with a complete verified download as fallback. Development, browser, Linux, and portable sessions use manual updates. Offline or failed checks leave model editing available.

The installer is unsigned. Desktop behavior is tested with the actual Electron runtime in Linux; native Windows execution is not validated in this cloud environment.

Developers can run and reproduce the Windows package with:

```sh
npm ci
npm run desktop
npm run build:windows
```

`build:windows` creates the installer, portable ZIP, latest.yml update feed and installer blockmap. The release workflow publishes all four plus checksums; publishing just the executable is insufficient for in-app updates. Versioned asset URLs in the feed keep an already-started update valid if another release is published. A release is staged as a draft until every asset uploads, then made public. Electron 44.6.0 and electron-builder 26.15.3 are pinned. Packaging needs the npm registry, GitHub release downloads, and their asset host. On Linux, the build script uses electron-builder's native NSIS uninstaller extractor to avoid executing the temporary installer stub in Wine. This compatibility hook depends on the pinned builder version; review it when upgrading. Windows builds use the normal NSIS flow. The app itself makes no external requests. Source and build tooling are excluded from the packaged runtime except the app entry metadata; the editor is bundled in `app.asar`.

In this cloud workspace, use `NODE_USE_ENV_PROXY=1 electron_config_cache=/workspace/.cache/electron npm ci --cache /workspace/.cache/npm --no-audit --no-fund`. If Electron's runtime is absent, run `NODE_USE_ENV_PROXY=1 electron_config_cache=/workspace/.cache/electron node node_modules/electron/install.js`. Build with `NODE_USE_ENV_PROXY=1 MESHCRAFT_ELECTRON_CACHE=/workspace/.cache/electron ELECTRON_BUILDER_CACHE=/workspace/.cache/electron-builder npm run build:windows` so downloads use writable caches. Desktop smoke checks use `npm run test:desktop` in a graphical session (or a virtual X display on Linux). They validate rendering offline, isolated renderer permissions, storage across process restarts, real native IPC exports, matching renamed OBJ/MTL files, and canceling exports. Linux test launch flags allow software rendering in the cloud; normal Windows launches use the default sandbox and hardware renderer. No credentials or signing certificate are required to build the unsigned package.

## Click to open

Download `release/Meshcraft.html` and double-click it to open the app in a modern desktop browser (Chrome, Edge, Firefox, or Safari). Keep the `.html` extension. This single file includes the app, 3D engine, styles, fonts, and icon, and works offline without Node.js, an installation, or a server.

Create and export models as usual. Collections use browser storage associated with this file; moving or renaming it may give it separate storage, depending on the browser. Download GLB/OBJ exports to keep permanent copies of your assets.

Developers can reproduce the downloadable file with:

```sh
npm run build:standalone
npm run test:standalone
```

The standalone test copies only the app file into an unrelated temporary folder and verifies 3D rendering, generation, editing, collection persistence, and both export formats with networking disabled. It attempts a direct `file://` launch. If a managed browser policy blocks local files, it reports that launch as skipped and tests the copied HTML through a single in-memory document response instead. This fallback needs no running server but does not validate file-origin behavior. Normal desktop browsers can open the self-contained HTML directly.

## Run the development server

Requires Node.js 22 or newer (tested with Node.js 24).

```sh
cd /workspace/3d-model-app
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm run dev -- --port 5173 --strictPort
```

The cache path avoids writing to the cloud machine's protected home directory. On a local machine, `npm ci` and `npm run dev` work with the normal npm cache. The server binds to `0.0.0.0`; default port is 5173.

## Create an asset

- Start in **Creatures** with Mossling, Emberfang, Tidewhisk, Cragback, Skyplume, or Riftwyrm. The six starting species range from cute woodland companions to horned hunters and winged serpents. The **World props** tab includes the original sword, shield, tree, rock, chest, and potion.
- Describe a supported creature and features: “A cute purple rabbit with antlers, crystal wings, a fin tail, and three eyes,” “A fierce fire dragon with no wings,” or “A blue slime.” Color words and `simple`, `low-poly`, or `detailed` also work. Prompts select procedural anatomy, rather than calling an AI service or generating arbitrary objects.
- Use the anatomy panel to mix five body plans (two-legged, four-legged, bird, serpent, and blob), ears, horns/antlers, three wing styles, tails, back details, patterns, and one to three eyes. Adjust head/body proportions, snout length, and temperament; fierce creatures develop brows, fangs, and claws. Leg length applies to the body plans that have legs.
- Choose Nature, Fire, Water, Earth, Frost, Storm, or Shadow for coordinated colors and elemental motifs. Colors can then be edited independently. **Surprise me** creates a new combination with a recorded variation seed.
- Edit the name, primary and accent colors, geometry detail, scale, and seed. Creature seeds affect proportions, spots, and back details; the same settings and seed reproduce the same geometry. Props retain their existing variation behavior.
- Drag the live preview to orbit, scroll to zoom, or right-drag to pan. The preview starts closer to the model. Use the visible +/− magnifying-glass buttons for 50–300% preview zoom, scroll to move closer, or fit/reset the view to return to 100%. Preview zoom preserves the exported size and your orbit angle. View controls also provide wireframe, grid, and rotation.
- Save models to a searchable collection in browser local storage. The current editing draft is also saved locally. Collections do not sync across devices; export assets for a backup.

## Large creatures and bosses

The size panel supports **0.25–100× scale**, with **Companion (0.5×)**, **Large (3×)**, **Giant (10×)**, and **Titan (30×)** presets. Enter an **Exact scale** or a **Height in meters**, then press Enter or leave the field to apply it. Height measures the configured pose, including horns, wings, and other high features; it is limited by the same scale range. Editing anatomy afterward can change the resulting height.

**Boss proportions** gives the current creature a broader body, smaller head, longer snout, longer legs, fierce features, and back spikes, and increases its scale to at least 10×. Its existing body plan, element, and other custom features remain editable. Try “a giant green lizard with no wings” for a reptile starting point, or use “large,” “giant,” “huge,” “massive,” “titan,” or “colossal” in creature prompts to select a larger scale.

The optional **1.8 m person** provides a size comparison in the preview. It is a scene reference and is excluded from exports. The camera, grid, lighting, and clipping range adjust to large creatures. Camera fitting keeps them visible; dimensions in meters and the reference person show their physical size. Drafts and collection entries retain the selected scale. GLB preserves it for the rig and animations, and OBJ bakes it into the vertices. Enlarging a model keeps its triangle count unchanged.

## Human character creator

Open **Humans** to start with a Ranger, Knight, Mage, Rogue, Traveler, or Citizen. The editor has **56 appearance controls** across six tabs. These make original stylized low-poly people, rather than photorealistic scans.

In version **1.1.0**, choose **Soft**, **Defined**, **Elegant**, or **Heroic** under **A polished starting look** for coordinated facial features, hair, and body proportions. Applying a look opens the Face tab and close-up preview. Skin tone, colors, clothing, accessories, and rig settings remain editable and retain your choices. Appearance values are ordinary saved character settings, so you can adjust individual features afterward and keep the result in your collection.

Human faces now use one continuous faceted head with integrated cheek and jaw shaping, almond-shaped eyes and upper lids, a small faceted nose, subtler lips, and a scalp that follows the head shape with curved swept fringes. The base head proportions are less oversized. Existing human saves retain their settings and render with the improved geometry; the 19-joint rig and Idle/Walk clips continue to follow the new face and hair. These are stylized starter characters; aesthetic preferences remain a matter of choosing and adjusting the available looks.

- **Body:** height, shoulders, chest, waist, hips, muscle definition, arm/leg/torso length, and hand/foot size. Balanced, Slender, Broad, and Curvy buttons set a starting frame. Choose a relaxed, A-, or T-pose as the exported base pose.
- **Face:** head size, face/jaw/cheek proportions, chin, eye size/spacing, brow angle, nose width/projection, mouth/lips, ear size, human or elf ears, eyebrows, expression, freckles, and a scar. Selecting Face or Hair switches the viewport to a face close-up; the view selector returns to the full body.
- **Hair:** eleven hairstyles (including bald, cropped, swept, bob, long, ponytail, bun, mohawk, spiky, curls, and braids), five facial-hair styles, volume, length, and separate hair/brow colors. Hair length is disabled for styles it does not affect.
- **Outfit:** six tops, three sleeve lengths, trousers/shorts/skirt, shoes/boots/sandals, gloves/gauntlets, and separate outfit colors.
- **Accessories:** caps, hoods, helmets, crowns, wizard hats, round/square glasses or an eye patch, earrings, necklaces, belts, capes, packs, shoulder armor, and wristbands.
- **Colors:** eight skin-tone presets plus custom skin, hair, eye, brow, lip, top, bottom, footwear, and accessory colors. Shared Primary/Accent colors stay in sync with top/accessory colors.

**Randomize look** creates a new editable combination. Reset restores the current archetype. Save the full appearance and joint pose to the **Humans** collection filter; drafts also restore after reload. Fixed settings and seed reproduce the model (human seeds vary freckles).

Humans are automatically skinned to a 19-joint rig with **Idle** and **Walk** loops. Clothing follows the relevant arm, torso, or leg joints; face details, hair, and headwear follow the head. GLB includes the whole character, weights, bones, configured base pose, and clips. OBJ/MTL bakes the configured pose into ordinary vertices. These are starter rigs: fingers, facial blendshapes, cloth simulation, and automatic Unity Humanoid mapping are not generated. Some assembled parts can overlap at extreme proportions or poses; refine the model and animations in Blender as needed. For Unity, use a glTF importer or convert GLB to FBX through Blender; the Generic-rig workflow remains the tested-format recommendation, while actual Unity imports have not been tested here.

## Rig and animate a character

**Auto rig** is enabled for humans and creatures by default. The rig follows the selected body plan and creates actual bones, a shared skeleton, and normalized vertex skin weights for all the named mesh parts. Limbs bend through weighted geometry; eyes, horns, and facial details follow the head. Optional wings, ears, and tails get their own joints. World props remain static.

- In **Creature rig**, select **Idle**, **Walk**, **Slither**, or **Bounce** (depending on anatomy). **Fly** appears when wings are present. All generated clips loop in place.
- Pause/resume, show the skeleton, and adjust animation speed and movement amount. Both values are saved into the exported clips.
- Select a joint and adjust its X/Y/Z rotation to pose it. Joint edits switch the preview to **Rest**; the configured pose becomes the base for animations. Reset joint poses to return to the original bind pose. Drafts and collection entries preserve rig settings and poses.
- Export **GLB** for the skeleton, skin weights, configured pose, and all animation clips. Export **OBJ + MTL** for an ordinary mesh with the configured joint pose baked into the vertices. Exporting does not capture the current playback frame.
- Turn off **Auto rig** to export a static creature. Existing saved creatures are automatically rigged when opened unless rigging was explicitly disabled.

This is a procedural character rig and starter animation system. It does not provide IK, foot planting, a weight-paint editor, humanoid retargeting, root motion, custom keyframe authoring, or rigs for imported models. Extreme joint angles can stretch or overlap assembled parts; refine weights and movement in Blender for production characters.

## Exports and game engines

**GLB** is the recommended format. It includes geometry, normals, geometry UVs, and PBR material colors in one binary glTF 2.0 file. Rigged humans and creatures also include bones, skin weights, and animation clips. **OBJ** downloads an OBJ mesh plus a matching MTL material file; keep them together and permit multiple downloads if prompted. Models stand on the ground, use Y-up orientation, and measure in meters.

- **Godot:** drag the GLB into the project. Use its imported skeleton and AnimationPlayer/AnimationTree to play creature clips.
- **Unity:** use the official glTFast package for GLB and a Generic rig for creature animations, or import both OBJ and MTL for static meshes.
- **Unreal Engine 5:** check skeletal glTF support in your engine version. If needed, open the GLB in Blender and export FBX, then import as a Skeletal Mesh. The app does not export FBX directly.

Humans and creatures remain **assembled meshes**: separately named parts can overlap and are not welded or watertight character sculpts. Textures, packed texture-atlas UVs, LODs, and collisions are not generated. Merge/retopologize parts and refine the rig in Blender as needed; configure collision and gameplay animation states in your engine. GLB retains part names and metadata (body plan, element, seed, rigged status, bone count, and clip names). GLB skeleton/animation round trips are validated with Three.js; individual game-engine imports have not been run here.

Static creature presets at balanced detail are roughly 3,300–5,100 triangles before custom feature changes. Rigging adds limb segments for bending. Current counts are shown in the app. Detail changes sphere/cylinder segmentation and rock subdivisions; some extruded parts keep their topology.

## Validation

```sh
npm test
npm run build
# With the dev server already running:
npm run test:browser
```

Model tests cover all 18 presets at all detail levels, finite vertices/normals/UVs, ground alignment, deterministic seeds, scaling, prompt behavior, all five creature body plans at extreme proportions, actual feature geometry, temperament, and input validation. Browser checks exercise real WebGL rendering, prompts, controls, persistent collections, deletion, the engine guide, responsive navigation, GLB round-trip loading, and matching OBJ/MTL material references. Creature checks verify anatomy editing, saved configurations, categories, exported named parts/metadata, randomized combinations, and mobile controls. Rig tests cover all five body plans, normalized skin weights, rest-bind geometry at multiple scales, seamless deforming clips, posed attachments, OBJ pose baking, speed/intensity controls, static opt-out, and stored rig validation. Browser checks reload an animated GLB and verify actual vertex deformation, playback controls, pose persistence, and static exports. Human tests verify all 26 sliders affect geometry, every style creates a distinct model/material result, color controls affect exported materials, all six rigs animate, extreme proportions bind correctly, posed outfits bake correctly, deterministic freckles, and input validation. Browser tests exercise human editing, face zoom, poses, hair/outfits/accessories, palette synchronization, collection filtering/persistence, GLB re-import with animated clothing, randomization, and mobile layout. The isolated standalone test verifies customized humans and creatures, skeletons, skin weights, animation clips, and both export formats while offline.

Browser checks use the installed Chromium at `/usr/bin/chromium`. Override it with `CHROMIUM_PATH`; override the server with `TEST_BASE_URL`. The test uses Chromium's software WebGL renderer so it can run without a GPU. Screenshots are written to a temporary directory reported by the test. Production build output is in `dist/`; serve it with `npm run preview` or deploy it to a static hosting service. Build output includes a Three.js chunk size advisory; it does not prevent a successful build.

## Cloud environment

The repository is already isolated under `/workspace/3d-model-app`. Use this checkout; do not create a Git worktree unless explicitly requested. Dependency installation needs `registry.npmjs.org`; the editor uses bundled fonts and works offline. Installed Windows update checks contact github.com and its release-assets.githubusercontent.com download host; model generation and exports require no service. WebGL is required for the interactive preview. Model customization and export do not require a GPU server.

Reusable installation and startup instructions are saved in the environment configuration draft. Saving the draft does not publish or deploy the app. Review and save the configuration in environment settings, then publish the prepared cloud environment to retain its filesystem snapshot. Running server processes must be restarted in a future task.
