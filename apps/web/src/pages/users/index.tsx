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
import { Trash, SquarePen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = searchParams.get("page");
  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  function handleEditUser(user: UserRow) {
    console.log("Editar usuário", user);
  }

  function handleDeleteUser(user: UserRow) {
    console.log("Remover usuário", user);
  }

  function formatDate(dateIso: string) {
    const date = new Date(dateIso);
    return date.toLocaleString("pt-BR");
  }

  const skeletonRows = Array.from({ length: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários</CardTitle>
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
                          onClick={() => handleEditUser(user)}
                        >
                          <SquarePen className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
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
  );
}
