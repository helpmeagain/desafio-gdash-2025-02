import * as React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { login, refresh } from "@/lib/auth/authApi";
import { getCurrentUser } from "@/lib/auth/authStorage";
import axios from "axios";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const user = getCurrentUser();

        if (user) {
          if (!cancelled) {
            navigate("/clima", { replace: true });
          }
          return;
        }

        try {
          await refresh();
          if (!cancelled) {
            navigate("/clima", { replace: true });
          }
        } catch (err) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            console.log("Erro ao tentar reaproveitar sessão", status);
          } else {
            console.log("Erro inesperado ao tentar reaproveitar sessão", err);
          }
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/clima");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        console.log(status);
        if (status === 400) {
          setError("A senha deve possuir pelo menos 8 caracteres");
        } else if (status === 401) {
          setError("Email ou senha inválidos");
        } else if (status === 500) {
          setError("Erro interno no servidor. Tente novamente mais tarde");
        } else {
          setError("Erro inesperado ao tentar realizar o login");
        }
      } else {
        setError("Erro inesperado na aplicação");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <span className="text-muted-foreground text-sm">
          Verificando sessão
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Entre na sua conta</CardTitle>
              <CardDescription>
                Entre na sua conta utilizando email e senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {error && (
                    <Field>
                      <p className="text-sm text-destructive">{error}</p>
                    </Field>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Senha</FieldLabel>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Entrando..." : "Login"}
                    </Button>
                    <FieldDescription className="text-center">
                      Não possui uma conta{" "}
                      <Link to="/register" className="underline">
                        Cadastrar
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
