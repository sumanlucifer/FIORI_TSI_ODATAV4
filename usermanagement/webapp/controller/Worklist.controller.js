sap.ui.define(
    [
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "../model/formatter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/ui/core/Fragment",
        "sap/ui/model/Sorter",
        "sap/ui/Device",
        "sap/m/MessageToast",
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV"
    ],
    function (
        BaseController,
        JSONModel,
        formatter,
        Filter,
        FilterOperator,
        MessageBox,
        Fragment,
        Sorter,
        Device,
        MessageToast,
        Export,
        ExportTypeCSV
    ) {
        "use strict";
        return BaseController.extend(
            "com.knpl.tsi.usermanagement.controller.Worklist", {
            formatter: formatter,
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            /**
             * Called when the worklist controller is instantiated.
             * @public
             */
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                var oDataControl = {
                    filterBar: {
                        Search: ""
                    },
                    PageBusy: false
                };
                var oViewCtrl = new JSONModel(oDataControl);
                this.getView().setModel(oViewCtrl, "objectModel");
                var oMdlCtrl = new JSONModel();
                this.getView().setModel(oMdlCtrl, "oModelControl");
                oRouter
                    .getRoute("worklist")
                    .attachMatched(this._onRouteMatched, this);
            },
            _ResetFilterBar: function () {
                var aResetProp = {
                    salesGroup: [],
                    Search: ""
                };
                var oViewModel = this.getView().getModel("objectModel");
                oViewModel.setProperty("/filterBar", aResetProp);
                this.byId("idsalesGroupMINP").setTokens([]);
            },
            _onRouteMatched: function () {
                this.getUserList(null, null);
                this._InitData();
            },
            onPressAddObject: function () {
                /*
                 * Author: Deepanjali
                 * Date: 11-AUg-2022
                 * Language:  JS
                 * Purpose: Navigation to add object view and controller
                 */
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Add");
            },
            _InitData: function () {
                /*
                 * Author:Deepanjali
                 * Date: 11-AUg-2022
                 * Language:  JS
                 * Purpose: once the view elements load we have to 
                 * 1. get the logged in users informaion. 2.rebind the table to load data and apply filters 3. perform other operations that are required at the time 
                 * of loading the application
                 */
                var othat = this;
                var oView = this.getView();
                this.aSelectedKeys = [];
                c1 = othat._addSearchFieldAssociationToFB();
            },
            _addSearchFieldAssociationToFB: function () {
                /*
                 * Author: Deepanjali
                 * Date: 11-AUg-2022
                 * Language:  JS
                 * Purpose: add the search field in the filter bar in the view.
                 */
                var promise = jQuery.Deferred();
                let oFilterBar = this.getView().byId("filterbar");
                let oSearchField = oFilterBar.getBasicSearch();
                var oBasicSearch;
                var othat = this;
                if (!oSearchField) {
                    // @ts-ignore
                    oBasicSearch = new sap.m.SearchField({
                        value: "{objectModel>/filterBar/Search}",
                        showSearchButton: true,
                        search: othat.onSearch.bind(othat)
                    });
                    oFilterBar.setBasicSearch(oBasicSearch);
                }
                promise.resolve();
                return promise;
            },
            getUserList: function (nTopRec, nskipRec, sSearch, aSalesgrp, appstaus, ssort, sortcolumn) {
                var oModel = this.getOwnerComponent().getModel();
                this.getView().getModel("objectModel").setProperty("/PageBusy", true);
                var oActionODataContextBinding = oModel.bindContext("/getTSIUserList(...)");
                oActionODataContextBinding.setParameter("topRec", nTopRec ? nTopRec : null);
                oActionODataContextBinding.setParameter("skipRec", nskipRec ? nskipRec : null);
                oActionODataContextBinding.setParameter("searchText", sSearch ? sSearch : "");
                oActionODataContextBinding.setParameter("salesGroup", aSalesgrp ? aSalesgrp : []);
                oActionODataContextBinding.setParameter("appStatus", appstaus ? appstaus : null);
                oActionODataContextBinding.setParameter("sortOrder", ssort ? ssort : "ASC");
                // oActionODataContextBinding.setParameter("sortOrder", ssort ? ssort : "DESC");
                oActionODataContextBinding.setParameter("sortColumn", sortcolumn ? sortcolumn : "FIRST_NAME");
                oActionODataContextBinding.execute().then(
                    function () {
                        this.getView().getModel("objectModel").setProperty("/PageBusy", false);
                        var aNewUsers = oActionODataContextBinding.getBoundContext().getObject().USERS;
                        var nTotalCount = oActionODataContextBinding.getBoundContext().getObject().TOTAL_COUNT;
                        this.getView().getModel("objectModel").setProperty("/total", nTotalCount);
                        this.getView().getModel("oModelControl").setData(aNewUsers);
                        var aExistingUsers = this.getView().getModel("oModelControl").getData();
                        // if (aNewUsers.length > 0) {
                        //     this.getView().getModel("oModelControl").setData([...aNewUsers, ...aExistingUsers]);
                        // }
                    }.bind(this)
                );
            },
            onUpdateFinish: function (oevent) {
            },
            onSearch: function (oevent) {
                var sSearchText = this.getView().getModel("objectModel").getProperty("/filterBar/Search");
                var aSaleGrp = this.fnGetSalesGroupsTokens();
                var sApprvlStatus = this.getView().getModel("objectModel").getProperty("/filterBar/ApprovalStatus");
                this.getUserList(null, null, sSearchText, aSaleGrp, sApprvlStatus, null, "FIRST_NAME");
            },
            fnGetSalesGroupsTokens: function () {
                var aTokens = this.byId("idsalesGroupMINP").getTokens(),
                    aTokenIDs = [];
                for (var i = 0; i < aTokens.length; i++) {
                    aTokenIDs.push(aTokens[i].getText());
                }
                return aTokenIDs;
            },
            // onSort: function () {
            //     this.getUserList(null, null, null, null, null, "ASC", "FIRST_NAME");
            // },
            onSort: function () {
                if (!this._oSortDialog) {
                    this._oSortDialog = sap.ui.xmlfragment("com.knpl.tsi.usermanagement.view.fragments.SortDialog", this);
                    this.getView().addDependent(this._oSortDialog);
                }
                if (Device.system.desktop) {
                    this._oSortDialog.addStyleClass("sapUiSizeCompact");
                }
                this._oSortDialog.open();
            },
            onSalesGrpSelectionChange: function (oEvent) {
                var aSelectedLineItems = oEvent.getSource().getSelectedItems();
                
                   this.aSelectedKeys = aSelectedLineItems.map(function(items){
                        return {
                            text: items.getBindingContext().getObject().SALES_GRP
                        
                        }; 
                    });
               
                this.getView().getModel("objectModel").setProperty("/filterBar/salesGroup",  this.aSelectedKeys);
            },
            handleSortDialogConfirm: function (oEvent) {
                var sSortValue = oEvent.getParameters().sortItem ? oEvent.getParameters().sortItem.getKey() : null,
                    bSortColumn = oEvent.getParameters().sortDescending,
                    bSortColumn = bSortColumn ? "DESC" : "ASC";
                this.getUserList(null, null, null, null, null, bSortColumn, sSortValue);
            },
            onDataExport: sap.m.Table.prototype.exportData || function () {
                var oModel = this.getView().getModel("oModelControl");
                var oExport = new Export({
                    exportType: new ExportTypeCSV({
                        fileExtension: "csv",
                        separatorChar: ","
                    }),
                    models: oModel,
                    rows: {
                        path: "/"
                    },
                    columns: [{
                        name: "First Name",
                        template: {
                            content: "{FIRST_NAME}"
                        }
                    }, {
                        name: "Last name",
                        template: {
                            content: "{LAST_NAME}"
                        }
                    }, {
                        name: "Email",
                        template: {
                            content: "{EMAIL}"
                        }
                    }, {
                        name: "Sales Group",
                        template: {
                            content: "{= ${SALES_GROUP}.join(';') }"
                        }
                    }, {
                        name: "App Version",
                        template: {
                            content: "{= ${APP_VERSION} !== null ? ${APP_VERSION} : '--'}"
                        }
                    },
                    {
                        name: "App Status",
                        template: {
                            content: "{APP_STATUS}"
                        }
                    },
                    {
                        name: "Login Date & Time",
                        template: {
                            content: "{= ${LAST_LOGIN_AT} !== null ? ${LAST_LOGIN_AT} : '--'}"
                        }
                    },
                    {
                        name: "Status",
                        template: {
                            content: "{STATUS}"
                        }
                    }]
                });
                console.log(oExport);
                oExport.saveFile("TSI Users").catch(function (oError) {
                }).then(function () {
                    oExport.destroy();
                });
            },
            onLoadMoreData: function () {
                // this.getUserList(20, 0);
            },
            oProdValueHelpRequest: function () {
                var oView = this.getView()
                var othat = this;
                if (!this._oDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "com.knpl.tsi.usermanagement.view.fragments.salesGroupValueHelp",
                        controller: othat
                    }).then(function (oDialog) {
                        this._oDialog = oDialog;
                        oView.addDependent(this._oDialog);
                        var oList = oView.byId("idList");
                        var oSList = oView.byId("idStanList");
                        var sBindingPath = "/getSalesGroupList(searchText='')";
                        oList.bindItems(sBindingPath, oSList);
                        this._oDialog.open();
                    }.bind(this))
                } else {
                    this._oDialog.open();
                }
            },
            onSearchSalesGroup: function () {
               
                var sSearchSaleGrpVal = this.getView().getModel("objectModel").getProperty("/filterBar/salesGroupSearchVal");
                this.getView().getModel("objectModel").setProperty("/PageBusy", true);
                var oList = this.getView().byId("idList");
                var oSList = this.getView().byId("idStanList");
                var sBindingPath = "/getSalesGroupList(searchText='" + sSearchSaleGrpVal + "')";
                oList.bindItems(sBindingPath, oSList);
                this.getView().getModel("objectModel").setProperty("/PageBusy", false);
               
            },
            onResetFilterBar: function () {
                this._ResetFilterBar();
                this.getUserList(null, null);
            },
            onPressApproveReject: function (oEve) {
                var sEmail = oEve.getSource().getBindingContext("oModelControl").getObject().EMAIL;
                var sActivated = oEve.getSource().getBindingContext("oModelControl").getObject().IS_ACTIVATED;
                var sStatus = sActivated === 0 ? 1 : 0,
                    sMessage = sActivated === 1 ? "Deactivate" : "Activate",
                    sAccptRejctCheck = sActivated === "Deactivated" ? this._showMessageBox("information", "MsgConfirm", [sMessage], this.onApproveRejectServiceCall.bind(this, sEmail, sStatus, "Approved")) : this._showMessageBox("information", "MsgConfirm", [sMessage], this.onApproveRejectServiceCall.bind(this, sEmail, sStatus, "Approved"));
            },
            onApproveRejectServiceCall: function (sEmail, sStatus) {
                var oModel = this.getOwnerComponent().getModel();
                this.getView().getModel("objectModel").setProperty("/PageBusy", true);
                var oActionODataContextBinding = oModel.bindContext("/updateTSIUserStatus(...)");
                oActionODataContextBinding.setParameter("email", sEmail);
                oActionODataContextBinding.setParameter("isActivated", sStatus);
                oActionODataContextBinding.execute().then(
                    function () {
                        var aSaleGrp = this.fnGetSalesGroupsTokens();
                        var sApprvlStatus = this.getView().getModel("objectModel").getProperty("/filterBar/ApprovalStatus") ? this.getView().getModel("objectModel").getProperty("/filterBar/ApprovalStatus") : null;
                        this.getUserList(null, null, null, aSaleGrp, sApprvlStatus, null, null);
                        this.getView().getModel("objectModel").setProperty("/PageBusy", false);
                        var oResponseTxt = oActionODataContextBinding.getBoundContext().getObject();
                        MessageToast.show(oResponseTxt.value);
                    }.bind(this)
                );
            },
            onSalesGroupDialogClose: function () {
                // var aSelectedSalesGroupItems = this.byId("idList").getSelectedItems(),
                //     aTockes = [];
                // for (var i = 0; i < aSelectedSalesGroupItems.length; i++) {
                //     var sSALES_GRP = aSelectedSalesGroupItems[i].getBindingContext().getObject().SALES_GRP;
                //     aTockes.push(new sap.m.Token({ text: sSALES_GRP }));
                // }
                // this.byId("idsalesGroupMINP").setTokens(aTockes);
                // this.byId("idList").removeSelections();
                this._oDialog.close();
            },
        });
    });
