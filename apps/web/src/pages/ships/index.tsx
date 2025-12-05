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
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Starship {
  name: string;
  model: string;
  starship_class: string;
  crew: string;
  passengers: string;
  cost_in_credits: string;
  manufacturer: string;
  length: string;
  max_atmosphering_speed: string;
  cargo_capacity: string;
  consumables: string;
  hyperdrive_rating: string;
  MGLT: string;
  films: string[];
  pilots: string[];
  created: string;
  edited: string;
  url: string;
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

  const [selectedShip, setSelectedShip] = React.useState<Starship | null>(null);

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
    <>
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
                  <TableHead>Tripulação</TableHead>
                  <TableHead>Passageiros</TableHead>
                  <TableHead>Custo (créditos)</TableHead>
                  <TableHead>Ações</TableHead>
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
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-[100px]" />
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
                      <TableCell>{ship.crew}</TableCell>
                      <TableCell>{ship.passengers}</TableCell>
                      <TableCell>{ship.cost_in_credits}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedShip(ship)}
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Saiba mais
                        </Button>
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
        open={!!selectedShip}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedShip(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {selectedShip && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedShip.name}</DialogTitle>
                <DialogDescription>
                  Detalhes completos da nave selecionada
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Modelo</span>{" "}
                  {selectedShip.model}
                </div>
                <div>
                  <span className="font-semibold">Classe</span>{" "}
                  {selectedShip.starship_class}
                </div>
                <div>
                  <span className="font-semibold">Fabricante</span>{" "}
                  {selectedShip.manufacturer}
                </div>
                <div>
                  <span className="font-semibold">Custo em créditos</span>{" "}
                  {selectedShip.cost_in_credits}
                </div>
                <div>
                  <span className="font-semibold">Comprimento</span>{" "}
                  {selectedShip.length}
                </div>
                <div>
                  <span className="font-semibold">
                    Velocidade máxima na atmosfera
                  </span>{" "}
                  {selectedShip.max_atmosphering_speed}
                </div>
                <div>
                  <span className="font-semibold">Tripulação</span>{" "}
                  {selectedShip.crew}
                </div>
                <div>
                  <span className="font-semibold">Passageiros</span>{" "}
                  {selectedShip.passengers}
                </div>
                <div>
                  <span className="font-semibold">Capacidade de carga</span>{" "}
                  {selectedShip.cargo_capacity}
                </div>
                <div>
                  <span className="font-semibold">Consumíveis</span>{" "}
                  {selectedShip.consumables}
                </div>
                <div>
                  <span className="font-semibold">Hyperdrive rating</span>{" "}
                  {selectedShip.hyperdrive_rating}
                </div>
                <div>
                  <span className="font-semibold">MGLT</span>{" "}
                  {selectedShip.MGLT}
                </div>
                <div>
                  <span className="font-semibold">Pilotos</span>{" "}
                  {selectedShip.pilots.length > 0
                    ? selectedShip.pilots.join(", ")
                    : "Nenhum"}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
