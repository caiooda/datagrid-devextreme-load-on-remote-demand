import { HttpClient, HttpParams } from "@angular/common/http";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DxDataGridComponent } from "devextreme-angular";
import DataSource from "devextreme/data/data_source";
import { Observable, Subscription, take } from "rxjs";

@Component({
  templateUrl: "./grid.component.html",
})
export class GridComponent implements OnInit, OnDestroy {
  public readonly gridName = "Patrimônio Físico";

  private readonly URL_API = `${AppSettings.API_ENDPOINT_API}`;

  @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

  readonly allowedPageSizes = [500, 1000, 3000];

  conciliadoHeaderFilter = [
    {
      text: "Sim",
      value: ["conciliado", "=", 1],
    },
    {
      text: "Não",
      value: ["conciliado", "=", 0],
    },
  ];

  selectedRows: any[];

  dataSource: DataSource;

  gridEnabled: boolean = false;
  columnChooserEnabled: boolean = true;

  // private _successSubscription: Subscription;
  // private _errorSubscription: Subscription;

  constructor(
    private http: HttpClient,
    // private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.dataSource = new DataSource({
      load: (loadOptions) => {
        return new Promise((resolve, reject) => {
          this.carregar(
            loadOptions.skip,
            loadOptions.take,
            loadOptions.filter,
            loadOptions.sort
          ).subscribe({
            next({ data, totalCount }) {
              this.data = data;
              resolve({
                data,
                summary: null,
                groupCount: null,
                totalCount,
              });
            },
            error(err) {
              reject(err);
            },
          });
        });
      },
    });

    // this._successSubscription = this.service.success$.subscribe((message) =>
    //   this.messageService.successMessage(message)
    // );

    // this._errorSubscription = this.service.error$.subscribe((erro: any) => {
    //   this.messageService.errorMessage(erro.erros[0].mensagem);
    // });
  }

  ngOnDestroy(): void {
    // this._successSubscription.unsubscribe();
    // this._errorSubscription.unsubscribe();
  }

  carregar(
    skip: number,
    take: number,
    filter: any,
    sort: any
  ): Observable<any> {
    let params = new HttpParams();

    params = params.set("skip", skip.toString());
    params = params.set("take", take.toString());

    if (filter) {
      const filters = [];

      const process = (value) => {
        value.forEach((clause) => {
          if (clause != ("and" || "!") && typeof clause != "string") {
            if (Array.isArray(clause[0])) {
              process(clause);
            } else if (
              Array.isArray(clause) &&
              (clause[0] === "!" || clause.length === 2)
            ) {
              process(clause);
            } else {
              filters.push({ column: clause[0], value: clause[2] });
            }
          }
        });
      };

      if (
        typeof filter[0] === "string" &&
        Array.isArray(filter) &&
        filter.length >= 3
      ) {
        filters.push({ column: filter[0], value: filter[2] });
      } else {
        process(filter);
      }
      params = params.set("filter", JSON.stringify(filters));
    }
    if (sort) {
      const mappedSort = sort.map((r) => ({
        column: r.selector,
        desc: r.desc,
      }));
      params = params.set("sort", JSON.stringify(mappedSort));
    }

    return this.http.get<any>(
      `${this.URL_API}/patrimonio-fisico/on-demand`,
      { params }
    );
  }

  total(): Observable<any> {
    return this.http.get<any>(
      `${this.URL_API}/patrimonio-fisico/total`
    );
  }

  actionRowPrepared(e: any) {
    if (e.rowType === "data") {
      if (!e.data) return;
      // if (this.exibicao.value === "conciliacao") {
      //   if (e.data.conciliado == 1) {
      //     e.rowElement.className = e.rowElement.className + " row-green";
      //     return;
      //   }
      // }
      // if (this.exibicao.value === "inventario") {
      //   if (e.data.revisado) {
      //     if (e.data.revisado && e.data.incluido) {
      //       e.rowElement.className = e.rowElement.className + " text-green";
      //       return;
      //     }
      //     if (e.data.revisado && e.data.alterado) {
      //       e.rowElement.className = e.rowElement.className + " text-yellow";
      //       return;
      //     } else {
      //       e.rowElement.className = e.rowElement.className + " text-blue";
      //       return;
      //     }
      //   } else {
      //     if (e.data.incluido) {
      //       e.rowElement.className = e.rowElement.className + " text-green";
      //       return;
      //     }
      //     if (e.data.alterado) {
      //       e.rowElement.className = e.rowElement.className + " text-yellow";
      //       return;
      //     }
      //   }
      // }
    }
  }

  actionRowClick(row: any) {
    // this.service.localizar(row.data.patrimonioFisicoId);
    // this._routingService.patrimonioFisicoDetalhe(row.data.patrimonioFisicoId);
  }

  actionRecarragarStyleGrid() {
    if (this.dataSource.items().length <= 0) return;
    this.dataGrid.instance?.option("dataSource", this.dataSource);
    // this.service.modoDeExibicao$.next(this.exibicao.value);
  }

  actionSelectionChanged(e: any) {
    if (!this.selectedRows) {
      return;
    }

    if (this.selectedRows.filter((item) => item.conciliado).length > 0) {
      // this.selectedRowsHasConciliado = true;
    } else {
      // this.selectedRowsHasConciliado = false;
    }
  }

  actionEditorPreparing(e: any) {
    if (!e) return;

    if (e.parentType == "filterRow") {
      e.editorOptions.placeholder = "Filtrar...";
    }
  }

  actionContentReady(e: any) {
    if (!e) return;

    this.columnChooserEnabled = false;
    this.gridEnabled = true;
  }

  actionRecarregar() {
    if (this.gridName) {
      sessionStorage.removeItem(this.gridName);
      localStorage.removeItem(this.gridName);
    }

    this.dataGrid.instance.state(null);
    this.dataGrid.instance.clearFilter();
    this.dataGrid.instance.clearGrouping();
    this.dataSource.reload();
  }

  customSaveState = (arg: any) =>
    AppHelper.saveDatagridState(this.gridName, arg);

  customLoadState = () => AppHelper.loadDatagridState(this.gridName);
}
