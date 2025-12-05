import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
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
import { signup, refresh } from "@/lib/auth/authApi";
import { getCurrentUser } from "@/lib/auth/authStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function guard() {
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
        } catch {
          //
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    guard();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve possuir pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("A confirmação de senha não confere");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      setShowSuccessDialog(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { message?: string } | undefined;

        if (status === 400) {
          setError(
            data?.message ||
              "Dados inválidos, verifique as informações e tente novamente"
          );
        } else if (status === 409) {
          setError("Já existe uma conta cadastrada com este email");
        } else if (status === 500) {
          setError("Erro interno no servidor, tente novamente mais tarde");
        } else {
          setError("Erro inesperado ao tentar criar a conta");
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
        <Card {...props}>
          <CardHeader>
            <CardTitle>Crie uma conta</CardTitle>
            <CardDescription>
              Complete as informações abaixo para cadastrar uma nova conta
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
                  <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>

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
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Deve possuir 8 caracteres"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirme a senha
                  </FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Field>

                <FieldGroup>
                  <Field>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? "Criando conta..." : "Criar conta"}
                    </Button>
                    <FieldDescription className="px-6 text-center">
                      Já possui uma conta{" "}
                      <Link to="/" className="underline">
                        Logar
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <Dialog
          open={showSuccessDialog}
          onOpenChange={(open) => {
            setShowSuccessDialog(open);
            if (!open) {
              navigate("/", { replace: true });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conta criada com sucesso</DialogTitle>
              <DialogDescription>
                Seu cadastro foi realizado com sucesso. Agora você já pode
                acessar o sistema.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate("/", { replace: true });
                }}
              >
                Ir para o login
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
