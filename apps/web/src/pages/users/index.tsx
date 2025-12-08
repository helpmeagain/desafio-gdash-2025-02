import * as React from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash, SquarePen, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserRow {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Meta {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface UsersResponse {
  meta: Meta;
  data: UserRow[];
}

interface ApiErrorWithMeta {
  meta?: Meta;
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
}

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = searchParams.get("page");
  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editPassword, setEditPassword] = React.useState("");
  const [isSavingUser, setIsSavingUser] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [userToDelete, setUserToDelete] = React.useState<UserRow | null>(null);
  const [isDeletingUser, setIsDeletingUser] = React.useState(false);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [createPassword, setCreatePassword] = React.useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = React.useState("");
  const [isCreatingUser, setIsCreatingUser] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchUsers(currentPage: number) {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get<UsersResponse>("/user", {
          params: { page: currentPage },
        });

        if (cancelled) return;

        setUsers(data.data);
        setMeta(data.meta);

        if (data.meta.totalPages >= 1 && currentPage > data.meta.totalPages) {
          setSearchParams({ page: String(data.meta.totalPages) });
        }
      } catch (err: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError<ApiErrorWithMeta>(err)) {
          const status = err.response?.status;
          const metaFromError = err.response?.data?.meta;

          if (
            (status === 400 || status === 404) &&
            metaFromError &&
            metaFromError.totalPages >= 1 &&
            page > metaFromError.totalPages
          ) {
            setSearchParams({ page: String(metaFromError.totalPages) });
            return;
          }

          if (status === 401) {
            setError("Sessão expirada, faça login novamente");
          } else if (status === 403) {
            setError("Você não tem permissão para visualizar esta página");
          } else {
            setError("Erro ao carregar a lista de usuários");
          }
        } else {
          setError("Erro inesperado ao carregar a lista de usuários");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchUsers(page);

    return () => {
      cancelled = true;
    };
  }, [page, setSearchParams]);

  function handleChangePage(newPage: number) {
    if (!meta) {
      setSearchParams({ page: String(newPage) });
      return;
    }

    if (newPage < 1) {
      setSearchParams({ page: "1" });
      return;
    }

    const lastPage = meta.totalPages || 1;
    const clampedPage = newPage > lastPage ? lastPage : newPage;

    if (clampedPage === page) return;

    setSearchParams({ page: String(clampedPage) });
  }

  function openEditDialog(user: UserRow) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword("");
    setEditError(null);
  }

  async function handleSubmitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingUser) return;

    setIsSavingUser(true);
    setEditError(null);

    try {
      const payload: Partial<{
        name: string;
        email: string;
        password: string;
      }> = {};

      if (editName !== editingUser.name) {
        payload.name = editName;
      }
      if (editEmail !== editingUser.email) {
        payload.email = editEmail;
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      if (Object.keys(payload).length === 0) {
        setEditingUser(null);
        return;
      }

      const { data } = await api.patch<UserRow>(
        `/user/${editingUser._id}`,
        payload
      );

      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      setEditingUser(null);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        const message =
          err.response?.data?.message ??
          "Erro ao salvar as alterações do usuário";
        setEditError(message);
      } else {
        setEditError("Erro inesperado ao salvar o usuário");
      }
    } finally {
      setIsSavingUser(false);
    }
  }

  function handleEditUser(user: UserRow) {
    openEditDialog(user);
  }

  function handleDeleteUser(user: UserRow) {
    setUserToDelete(user);
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;

    setIsDeletingUser(true);

    try {
      await api.delete(`/user/${userToDelete._id}`);

      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));

      setMeta((prev) => {
        if (!prev) return prev;
        const newTotalItems = prev.totalItems - 1;
        const newTotalPages =
          newTotalItems > 0 ? Math.ceil(newTotalItems / prev.itemsPerPage) : 1;

        return {
          ...prev,
          totalItems: newTotalItems,
          totalPages: newTotalPages,
          hasNext: prev.currentPage < newTotalPages,
          hasPrevious: prev.currentPage > 1,
        };
      });

      setUserToDelete(null);
    } catch (err) {
      console.error("Erro ao remover usuário", err);
      setUserToDelete(null);
    } finally {
      setIsDeletingUser(false);
    }
  }

  async function handleSubmitCreate(event: React.FormEvent) {
    event.preventDefault();

    setCreateError(null);

    if (createPassword !== createConfirmPassword) {
      setCreateError("As senhas não coincidem");
      return;
    }

    setIsCreatingUser(true);

    try {
      const payload = {
        name: createName,
        email: createEmail,
        password: createPassword,
      };

      const { data } = await api.post<UserRow>("/user", payload);

      setUsers((prev) => [data, ...prev]);

      setMeta((prev) => {
        if (!prev) {
          return {
            totalItems: 1,
            itemsPerPage: 10,
            currentPage: 1,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          };
        }

        const newTotalItems = prev.totalItems + 1;
        const newTotalPages = Math.ceil(newTotalItems / prev.itemsPerPage);

        return {
          ...prev,
          totalItems: newTotalItems,
          totalPages: newTotalPages,
          hasNext: prev.currentPage < newTotalPages,
          hasPrevious: prev.currentPage > 1,
        };
      });

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateConfirmPassword("");
      setIsCreateOpen(false);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        const message =
          err.response?.data?.message ?? "Erro ao cadastrar usuário";
        setCreateError(message);
      } else {
        setCreateError("Erro inesperado ao cadastrar usuário");
      }
    } finally {
      setIsCreatingUser(false);
    }
  }

  function formatDate(dateIso: string) {
    const date = new Date(dateIso);
    return date.toLocaleString("pt-BR");
  }

  const skeletonRows = Array.from({ length: 10 });

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Usuários</CardTitle>
          <Button
            size="sm"
            className="cursor-pointer"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Cadastro
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  !error &&
                  skeletonRows.map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-[160px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[220px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[180px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[180px]" />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-start">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && error && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !error &&
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => handleEditUser(user)}
                          >
                            <SquarePen className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash className="mr-1 h-4 w-4" />
                            Remover
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handleChangePage(meta.currentPage - 1)}
                    className={
                      meta.hasPrevious ? "" : "pointer-events-none opacity-50"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: meta.totalPages }, (_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        isActive={pageNumber === meta.currentPage}
                        onClick={() => handleChangePage(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handleChangePage(meta.currentPage + 1)}
                    className={
                      meta.hasNext ? "" : "pointer-events-none opacity-50"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Nome do usuário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">
                Nova senha
                <span className="ml-1 text-xs text-muted-foreground">
                  opcional
                </span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(event) => setEditPassword(event.target.value)}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>

            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setEditingUser(null)}
                disabled={isSavingUser}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingUser}
                className="cursor-pointer"
              >
                {isSavingUser ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setCreateError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="Nome do usuário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Senha</Label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(event) => setCreatePassword(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-confirm-password">Confirmar senha</Label>
              <Input
                id="create-confirm-password"
                type="password"
                value={createConfirmPassword}
                onChange={(event) =>
                  setCreateConfirmPassword(event.target.value)
                }
                required
              />
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreatingUser}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingUser}
                className="cursor-pointer"
              >
                {isCreatingUser ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deseja realmente remover este usuário
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `Esta ação não pode ser desfeita. O usuário ${userToDelete.name} será removido permanentemente.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingUser}
              className="cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={isDeletingUser}
              className="cursor-pointer"
            >
              {isDeletingUser ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
