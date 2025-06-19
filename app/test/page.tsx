"use client";

import { useState, useEffect } from "react";
import { account, ID } from "../appwrite";

const LoginPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const user = await account.get();
      setIsAuthenticated(true);
      setUserName(user.name);
    } catch (error) {
      console.log("Error checking auth status:", error);

      setIsAuthenticated(false);
      setUserName("");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await account.createEmailPasswordSession(email, password);
      await checkAuthStatus(); // Re-check auth status after login
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const register = async (): Promise<void> => {
    try {
      await account.create(ID.unique(), email, password, name);
      await login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await account.deleteSession("current");
      await checkAuthStatus(); // Re-check auth status after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <p>Logged in as {userName}</p>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Not logged in</p>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
        <button type="button" onClick={() => login(email, password)}>
          Login
        </button>
        <button type="button" onClick={register}>
          Register
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
