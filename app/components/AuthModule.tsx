"use client";

import { useEffect, useState } from "react";

type AuthMode = "login" | "register";

type User = {
  name: string;
  email: string;
  password: string;
};

type AuthSession = {
  name: string;
  email: string;
};

const LOCAL_STORAGE_USERS_KEY = "authUsers";
const LOCAL_STORAGE_SESSION_KEY = "authSession";

function getStoredUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    window.localStorage.setItem(
      LOCAL_STORAGE_SESSION_KEY,
      JSON.stringify(session),
    );
  } else {
    window.localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthModule() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  useEffect(() => {
    if (mode === "login") {
      setName("");
      setConfirmPassword("");
    }
    setErrorMessage("");
    setSuccessMessage("");
  }, [mode]);

  const handleRegister = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMessage("Please fill in all registration fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const users = getStoredUsers();
    const userExists = users.some(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    if (userExists) {
      setErrorMessage("An account already exists with this email.");
      return;
    }

    const newUser: User = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    saveUsers([...users, newUser]);
    saveSession({ name: newUser.name, email: newUser.email });
    setCurrentUser({ name: newUser.name, email: newUser.email });
    setSuccessMessage("Registration successful! You are now logged in.");
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
  };

  const handleLogin = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const users = getStoredUsers();
    const user = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user || user.password !== password) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    saveSession({ name: user.name, email: user.email });
    setCurrentUser({ name: user.name, email: user.email });
    setSuccessMessage("Login successful! Welcome back.");
    setEmail("");
    setPassword("");
  };

  const handleLogout = () => {
    saveSession(null);
    setCurrentUser(null);
    setSuccessMessage("You have been logged out.");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-950 dark:bg-[#0b0b0b] dark:text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-200/30 dark:border-zinc-800 dark:bg-[#111] dark:shadow-black/20 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
            Simple auth module
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {currentUser
              ? `Welcome back, ${currentUser.name}!`
              : "Login or register"}
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Use the form below to create an account or sign in with a
            demo-friendly frontend-only flow.
          </p>
        </div>

        {currentUser ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950/60">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Signed in as
              </p>
              <p className="mt-2 text-lg font-semibold">{currentUser.email}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Name: {currentUser.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-center gap-2 rounded-3xl bg-zinc-100 p-1 text-sm dark:bg-zinc-900 sm:justify-start">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-2xl px-5 py-3 transition ${mode === "login" ? "bg-white text-zinc-950 shadow shadow-zinc-200 dark:bg-zinc-950 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-2xl px-5 py-3 transition ${mode === "register" ? "bg-white text-zinc-950 shadow shadow-zinc-200 dark:bg-zinc-950 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"}`}
              >
                Register
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                mode === "login" ? handleLogin() : handleRegister();
              }}
              className="space-y-6"
            >
              {mode === "register" && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-sky-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-sky-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-sky-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-sky-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              )}

              {errorMessage && (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/20 dark:text-red-200">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            How this module works
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Register a new account using email, password, and name.</li>
            <li>Login with existing credentials.</li>
            <li>
              Session state is kept in browser local storage for demo purposes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
