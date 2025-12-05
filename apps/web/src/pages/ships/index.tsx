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
import { Skeleton } from "@/components/ui/skeleton";

interface Starship {
  name: string;
  model: string;
  starship_class: string;
  crew: string;
  passengers: string;
  cost_in_credits: string;
}

interface Meta {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface StarshipsResponse {
  meta: Meta;
  data: Starship[];
}

interface ApiErrorWithMeta {
  meta?: Meta;
  message?: string;
}

export default function ShipsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = searchParams.get("page");
  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const [ships, setShips] = React.useState<Starship[]>([]);
  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchShips(currentPage: number) {
      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get<StarshipsResponse>("/swapi/starships", {
          params: { page: currentPage },
        });

        if (cancelled) return;

        setShips(data.data);
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
            setError("Erro ao carregar a lista de naves");
          }
        } else {
          setError("Erro inesperado ao carregar a lista de naves");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchShips(page);

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

  const skeletonRows = Array.from({ length: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Naves espaciais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Tripulação</TableHead>
                <TableHead>Passageiros</TableHead>
                <TableHead>Custo (créditos)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                !error &&
                skeletonRows.map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-[180px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[220px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[160px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[120px]" />
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

              {!isLoading && !error && ships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm">
                    Nenhuma nave encontrada
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !error &&
                ships.map((ship) => (
                  <TableRow key={ship.name}>
                    <TableCell className="font-medium">{ship.name}</TableCell>
                    <TableCell>{ship.model}</TableCell>
                    <TableCell>{ship.starship_class}</TableCell>
                    <TableCell>{ship.crew}</TableCell>
                    <TableCell>{ship.passengers}</TableCell>
                    <TableCell>{ship.cost_in_credits}</TableCell>
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
