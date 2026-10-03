import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { initials } from '../domain/model/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('signs in and keeps the user for the session', () => {
    service.signIn({ email: ' Lucia.Medina@RetailCo.pe ', password: 'demo1234' }, false).subscribe();

    const req = http.expectOne('/api/v1/authentication/sign-in');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('lucia.medina@retailco.pe');
    req.flush({ id: 1, email: 'lucia.medina@retailco.pe', fullName: 'Lucía Medina', role: 'Floor supervisor', storeId: 1, token: 't' });

    expect(service.isSignedIn()).toBe(true);
    expect(sessionStorage.getItem('ic-console-session')).toContain('Lucía Medina');
  });

  it('stays signed out when the credentials are wrong', () => {
    service.signIn({ email: 'x@y.pe', password: 'wrong1' }, true).subscribe({ error: () => undefined });
    http.expectOne('/api/v1/authentication/sign-in').flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isSignedIn()).toBe(false);
  });

  it('builds the avatar initials from the full name', () => {
    expect(initials('Lucía Medina')).toBe('LM');
  });
});
