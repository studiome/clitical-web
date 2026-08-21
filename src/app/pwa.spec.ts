import { readFileSync } from 'node:fs';

import { SwUpdate } from '@angular/service-worker';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { appConfig } from './app.config';

interface NgswAssetGroupConfig {
  name: string;
  resources: { files: string[] };
}

interface NgswConfig {
  assetGroups: NgswAssetGroupConfig[];
}

function readNgswConfig(): NgswConfig {
  return JSON.parse(readFileSync('ngsw-config.json', 'utf8'));
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface WebManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

function readManifest(): WebManifest {
  return JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
}

describe('PWA manifest', () => {
  it('identifies the app the same way the native apps do', () => {
    const manifest = readManifest();
    expect(manifest.name).toBe('CLiTICAL');
    expect(manifest.short_name).toBe('CLiTICAL');
    expect(manifest.description).toContain('CLTI');
  });

  it('uses the JSVS brand colour and launches standalone', () => {
    const manifest = readManifest();
    // Same seed colour the Material theme and clti_risk's manifest use.
    expect(manifest.theme_color.toLowerCase()).toBe('#2d6a7b');
    expect(manifest.background_color.toLowerCase()).toBe('#2d6a7b');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('.');
  });

  it('ships the icon sizes an installable PWA needs, including maskable', () => {
    const icons = readManifest().icons;
    const anyPurpose = icons.filter((icon) => icon.purpose !== 'maskable');
    const maskable = icons.filter((icon) => icon.purpose === 'maskable');

    for (const size of ['192x192', '512x512']) {
      expect(anyPurpose.map((icon) => icon.sizes)).toContain(size);
      expect(maskable.map((icon) => icon.sizes)).toContain(size);
    }
    for (const icon of icons) {
      expect(icon.type).toBe('image/png');
    }
  });
});

describe('service worker registration', () => {
  it('is provided by the application config', () => {
    TestBed.configureTestingModule({ providers: [appConfig.providers] });
    expect(TestBed.inject(SwUpdate)).toBeTruthy();
  });
});

describe('service worker asset caching', () => {
  it('caches the vendored ExcelJS bundle used by batch processing', () => {
    const config = readNgswConfig();
    const app = config.assetGroups.find((group) => group.name === 'app');
    expect(app).toBeTruthy();
    // ngsw globs: `*` does not cross `/`, so `/*.js` alone misses
    // vendor/exceljs/exceljs.min.js. A `**` glob is required to cache it.
    expect(app!.resources.files).toContain('/vendor/**/*.js');
  });
});
