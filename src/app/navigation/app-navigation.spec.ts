import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppNavigation, NavDestination } from './app-navigation';

@Component({ template: '' })
class Blank {}

const DESTINATIONS: NavDestination[] = [
  { id: 'risk', label: 'Risk Assessment', icon: 'analytics', link: '/' },
  { id: 'batch', label: 'Batch', icon: 'table_view', link: '/batch' },
  { id: 'references', label: 'References', icon: 'menu_book', link: '/references' },
  { id: 'settings', label: 'Settings', icon: 'settings', link: '/settings' },
];

function createFixture(activeId: string) {
  TestBed.configureTestingModule({
    imports: [AppNavigation],
    providers: [
      provideRouter([
        { path: '', component: Blank },
        { path: 'batch', component: Blank },
        { path: 'references', component: Blank },
        { path: 'settings', component: Blank },
      ]),
    ],
  });
  const fixture = TestBed.createComponent(AppNavigation);
  fixture.componentRef.setInput('destinations', DESTINATIONS);
  fixture.componentRef.setInput('activeId', activeId);
  return fixture;
}

describe('AppNavigation', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders a navigation landmark listing every destination', async () => {
    const fixture = createFixture('risk');
    await fixture.whenStable();
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
    const text = nav.textContent!;
    expect(text).toContain('Risk Assessment');
    expect(text).toContain('References');
    expect(text).toContain('Settings');
  });

  it('links each destination to its route', async () => {
    const fixture = createFixture('risk');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const hrefs = [...host.querySelectorAll<HTMLAnchorElement>('nav a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/', '/batch', '/references', '/settings']);
  });

  it('marks only the active destination with aria-current', async () => {
    const fixture = createFixture('references');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const links = [...host.querySelectorAll<HTMLAnchorElement>('nav a')];
    const current = links.filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain('References');
  });
});
