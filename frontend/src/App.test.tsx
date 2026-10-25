import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

vi.mock("./api", () => ({
  getToken: () => "",
  setToken: vi.fn(),
  api: { auth: vi.fn() }
}));

describe("authentication screen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows login fields and allows switching to registration", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create an account/i }));
    expect(screen.getByRole("heading", { name: /join the journey/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("requires email and password before submitting", () => {
    render(<App />);
    expect(screen.getByLabelText(/email address/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });
});
