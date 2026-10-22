import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('username validation', () => {
    const usernameErrorKinds = (value: string) => {
      const usernameField = component['registerForm'].username;
      usernameField().value.set(value);
      const kinds = usernameField()
        .errors()
        .map((error) => error.kind);
      console.log(`username "${value}" -> errors: [${kinds.join(', ')}]`);
      return kinds;
    };

    it('accepts alphanumeric usernames with at least 3 characters', () => {
      expect(usernameErrorKinds('abc')).toEqual([]);
      expect(usernameErrorKinds('VoxelVera42')).toEqual([]);
    });

    it('rejects usernames shorter than 3 characters', () => {
      expect(usernameErrorKinds('ab')).toEqual(['minLength']);
    });

    it('accepts exactly 20 characters and rejects 21', () => {
      expect(usernameErrorKinds('a'.repeat(20))).toEqual([]);
      expect(usernameErrorKinds('a'.repeat(21))).toEqual(['maxLength']);
    });

    it('rejects usernames containing spaces', () => {
      expect(usernameErrorKinds('voxel vera')).toEqual(['pattern']);
      expect(usernameErrorKinds(' abc')).toEqual(['pattern']);
    });

    it('rejects usernames containing special characters', () => {
      for (const value of ['voxel_vera', 'vera!', 'müller', 'a-b-c']) {
        expect(usernameErrorKinds(value)).toEqual(['pattern']);
      }
    });

    it('reports both errors for a short username with a special character', () => {
      expect(usernameErrorKinds('a!')).toEqual(['minLength', 'pattern']);
    });

    it('reports only required for an empty username', () => {
      expect(usernameErrorKinds('')).toEqual(['required']);
    });

    it('renders each error message once the field is touched', async () => {
      const usernameField = component['registerForm'].username;
      usernameField().value.set('a!');
      usernameField().markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();

      const messages = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.text-red-500'),
        (element) => element.textContent?.trim(),
      );
      console.log(`rendered username errors: ${JSON.stringify(messages)}`);
      expect(messages).toEqual([
        'Mindestens 3 Zeichen',
        'Nur Buchstaben und Ziffern, keine Leer- oder Sonderzeichen',
      ]);
    });
  });

  describe('password validation', () => {
    const passwordErrorKinds = (value: string) => {
      const passwordField = component['registerForm'].password;
      passwordField().value.set(value);
      const kinds = passwordField()
        .errors()
        .map((error) => error.kind);
      console.log(`password "${value}" -> errors: [${kinds.join(', ')}]`);
      return kinds;
    };

    it('accepts a password with 8+ characters, uppercase, digit and special character', () => {
      expect(passwordErrorKinds('Geheim1!')).toEqual([]);
    });

    it('reports only required for an empty password', () => {
      expect(passwordErrorKinds('')).toEqual(['required']);
    });

    it('rejects passwords shorter than 8 characters', () => {
      expect(passwordErrorKinds('Ab1!')).toEqual(['minLength']);
    });

    it('rejects passwords missing uppercase, digit or special character', () => {
      for (const value of ['geheim12!', 'Geheimnis!', 'Geheimnis1']) {
        expect(passwordErrorKinds(value)).toEqual(['strongPassword']);
      }
    });
  });

  describe('password repeat validation', () => {
    const confirmPasswordErrorKinds = (password: string, confirmPassword: string) => {
      const registerForm = component['registerForm'];
      registerForm.password().value.set(password);
      registerForm.confirmPassword().value.set(confirmPassword);
      const kinds = registerForm
        .confirmPassword()
        .errors()
        .map((error) => error.kind);
      console.log(
        `password "${password}", repeat "${confirmPassword}" -> errors: [${kinds.join(', ')}]`,
      );
      return kinds;
    };

    it('accepts a repeat equal to the password', () => {
      expect(confirmPasswordErrorKinds('Geheim1!', 'Geheim1!')).toEqual([]);
    });

    it('reports only required for an empty repeat', () => {
      expect(confirmPasswordErrorKinds('Geheim1!', '')).toEqual(['required']);
    });

    it('rejects a repeat that differs from the password', () => {
      expect(confirmPasswordErrorKinds('Geheim1!', 'Geheim1?')).toEqual(['fieldMismatch']);
    });

    it('re-validates the repeat when only the password changes', () => {
      expect(confirmPasswordErrorKinds('Geheim1!', 'Geheim1!')).toEqual([]);
      component['registerForm'].password().value.set('Anders2?');
      const kinds = component['registerForm']
        .confirmPassword()
        .errors()
        .map((error) => error.kind);
      console.log(`after password change -> repeat errors: [${kinds.join(', ')}]`);
      expect(kinds).toEqual(['fieldMismatch']);
    });
  });

  describe('email validation', () => {
    const renderedEmailErrors = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      const emailContainer = (fixture.nativeElement as HTMLElement).querySelector(
        '#signup-email',
      )!.parentElement!;
      const messages = Array.from(emailContainer.querySelectorAll('.text-red-500'), (element) =>
        element.textContent?.trim(),
      );
      console.log(`rendered email errors: ${JSON.stringify(messages)}`);
      return messages;
    };

    it('reports required for an empty email and email for a malformed one', () => {
      const emailField = component['registerForm'].email;
      expect(
        emailField()
          .errors()
          .map((error) => error.kind),
      ).toEqual(['required']);
      emailField().value.set('vera@');
      expect(
        emailField()
          .errors()
          .map((error) => error.kind),
      ).toEqual(['email']);
      emailField().value.set('vera@studio.dev');
      expect(emailField().errors()).toEqual([]);
    });

    it('hides errors until the field is touched', async () => {
      const emailField = component['registerForm'].email;
      emailField().value.set('vera@');
      expect(await renderedEmailErrors()).toEqual([]);

      emailField().markAsTouched();
      expect(await renderedEmailErrors()).toEqual(['Bitte eine E-Mail-Adresse eingeben.']);
    });
  });

  describe('submit', () => {
    const validUser = {
      username: 'vera42',
      email: 'vera42@studio.dev',
      password: 'Geheim1!',
      confirmPassword: 'Geheim1!',
    };

    const submitForm = () => {
      component['registerUser'].set(validUser);
      component['onSubmit'](new Event('submit'));
      const request = TestBed.inject(HttpTestingController).expectOne('/api/accounts');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(validUser);
      return request;
    };

    afterEach(() => TestBed.inject(HttpTestingController).verify());

    it('posts the form value and marks the user as registered', async () => {
      submitForm().flush(null, { status: 201, statusText: 'Created' });
      await fixture.whenStable();

      expect(component['registered']()).toBe(true);
    });

    it('clears all fields and shows no errors after a successful registration', async () => {
      submitForm().flush(null, { status: 201, statusText: 'Created' });
      await fixture.whenStable();
      fixture.detectChanges();

      const registerForm = component['registerForm'];
      expect(component['registerUser']()).toEqual({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      expect(registerForm().touched()).toBe(false);

      const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll('input');
      expect(Array.from(inputs, (input) => input.value)).toEqual(['', '', '', '']);
      expect((fixture.nativeElement as HTMLElement).querySelectorAll('.text-red-500').length).toBe(
        0,
      );
    });

    it('shows a taken username on the username field', async () => {
      submitForm().flush(
        { title: 'Benutzername ist schon vergeben!' },
        { status: 409, statusText: 'Conflict' },
      );
      await fixture.whenStable();

      expect(
        component['registerForm']
          .username()
          .errors()
          .map((error) => error.message),
      ).toEqual(['Benutzername ist bereits vergeben']);
      expect(component['registered']()).toBe(false);
    });

    it('shows a taken email on the email field', async () => {
      submitForm().flush(
        { title: 'Email existiert bereits!' },
        { status: 409, statusText: 'Conflict' },
      );
      await fixture.whenStable();

      expect(
        component['registerForm']
          .email()
          .errors()
          .map((error) => error.message),
      ).toEqual(['E-Mail wird bereits verwendet']);
    });

    it('maps backend validation errors to their fields', async () => {
      submitForm().flush(
        {
          detail: 'Validierung fehlgeschlagen',
          errors: { username: ['Größe muss zwischen 3 und 20 sein'] },
        },
        { status: 400, statusText: 'Bad Request' },
      );
      await fixture.whenStable();

      expect(
        component['registerForm']
          .username()
          .errors()
          .map((error) => error.message),
      ).toEqual(['Größe muss zwischen 3 und 20 sein']);
    });

    it('shows a general error for unexpected failures', async () => {
      submitForm().flush(null, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();

      expect(
        component['registerForm']()
          .errors()
          .map((error) => error.message),
      ).toEqual(['Registrierung fehlgeschlagen. Bitte versuche es später erneut.']);
    });
  });
});
