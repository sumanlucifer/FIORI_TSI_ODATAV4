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

                var objectModel = new JSONModel();
                this.getView().setModel(objectModel, "objectModel");
                var oMdlCtrl = new JSONModel();
                this.getView().setModel(oMdlCtrl, "oModelControl");
                oRouter
                    .getRoute("worklist")
                    .attachMatched(this._onRouteMatched, this);
            },
            _ResetFilterBar: function () {
                var aCurrentFilterValues = [];
                var aResetProp = {

                };
                var oViewModel = this.getView().getModel("oModelControl");
                oViewModel.setProperty("/filterBar", aResetProp);
                var oTable = this.getView().byId("idUserTable");
                oTable.rebindTable();
            },
            _onRouteMatched: function () {
                this.getUserList();
                this._InitData();
            },
            onPressAddObject: function () {
                /*
                 * Author: manik saluja
                 * Date: 02-Dec-2021
                 * Language:  JS
                 * Purpose: Navigation to add object view and controller
                 */
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Add");
            },
            _InitData: function () {
                /*
                 * Author: manik saluja
                 * Date: 02-Dec-2021
                 * Language:  JS
                 * Purpose: once the view elements load we have to 
                 * 1. get the logged in users informaion. 2.rebind the table to load data and apply filters 3. perform other operations that are required at the time 
                 * of loading the application
                 */
                var othat = this;
                var oView = this.getView();
                var oModelControl = oView.getModel("oModelControl");
                var c1, c2, c3, c4;
                // oModelControl.setProperty("/PageBusy", true)
                c1 = othat._addSearchFieldAssociationToFB();

            },
            _addSearchFieldAssociationToFB: function () {
                /*
                 * Author: manik saluja
                 * Date: 02-Dec-2021
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
                        value: "{oSearchControl>/filterBar/Search}",
                        showSearchButton: true,
                        search: othat.onSearch.bind(othat)
                    });
                    oFilterBar.setBasicSearch(oBasicSearch);
                }
                promise.resolve();
                return promise;
            },

            getUserList: function (aTop, skip, sSearch, salesgrp, appstaus, ssort, sortcolumn) {
                var oModel = this.getOwnerComponent().getModel();
                this.getView().getModel("objectModel").setProperty("/PageBusy", true);
                var oActionODataContextBinding = oModel.bindContext("/getTSIUserList(...)");
                oActionODataContextBinding.setParameter("searchText", sSearch ? sSearch : "");
                oActionODataContextBinding.setParameter("salesGroup", "");
                oActionODataContextBinding.setParameter("appStatus", null);
                oActionODataContextBinding.setParameter("sortOrder", ssort ? ssort : "DESC");
                oActionODataContextBinding.setParameter("sortColumn", sortcolumn ? sortcolumn : "FIRST_NAME");
                oActionODataContextBinding.setParameter("topRec", null);
                oActionODataContextBinding.setParameter("skipRec", null);
                oActionODataContextBinding.execute().then(
                    function () {
                        this.getView().getModel("objectModel").setProperty("/PageBusy", false);
                        var aNewUsers = oActionODataContextBinding.getBoundContext().getObject().USERS;
                        var aExistingUsers = this.getView().getModel("oModelControl").getData();
                        this.getView().getModel("objectModel").setProperty("/total", aNewUsers.length);
                        this.getView().getModel("oModelControl").setData(aNewUsers);
                    }.bind(this)
                );
            },
            onSearch: function (oevent) {
                var sText =oevent.getParameters().query;
                this.getUserList(null, null, sText, null, null, "ASC", "FIRST_NAME");
            },
            onSort: function () {
                this.getUserList(null, null, null, null, null, "ASC", "FIRST_NAME");
            },

            onDataExport: sap.m.Table.prototype.exportData || function () {
                var oModel = this.getView().getModel("oModelControl");
                var oExport = new Export({
                    exportType: new ExportTypeCSV({
                        fileExtension: "csv",
                        separatorChar: ";"
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
                            content: "{SALES_GROUP}"
                        }
                    }, {
                        name: "App Version",
                        template: {
                            content: "{= ${APP_VERSION} !== null ? ${APP_VERSION} : '---'}"
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
                            content: "{= ${LAST_LOGIN_AT} !== null ? ${LAST_LOGIN_AT} : '---'}"
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
                oExport.saveFile().catch(function (oError) {
                }).then(function () {
                    oExport.destroy();
                });
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
                        this._oDialog.open();
                    }.bind(this))
                }
            },




            onResetFilterBar: function () {
                this._ResetFilterBar();
            },
            onPressApproveReject: function (oEve) {
                var sEmail = oEve.getSource().getModel("oModelControl").getData();
                sButton = oEve.getSource().getTooltip().trim().toLowerCase(),
                    sStatus = sButton === "accepted" ? "2" : "rejected" ? "3" : "1",
                    sMessage = sButton === "accepted" ? "Approve" : "Reject",
                    sAccptRejctCheck = sButton === "accepted" ? this._showMessageBox("information", "MsgConfirm", [sMessage], this.onApproveRejectServiceCall.bind(this, sEmail, sStatus, "Approved")) : this._showMessageBox("remark", "MsgConfirm", [sMessage], "", "", sEmail, sStatus);
                // this._showMessageBox("information", "MsgConfirm", [sMessage], this.onApproveRejectServiceCall.bind(this, iId, sStatus));
            },

            onApproveRejectServiceCall: function (sEmail, sStatus) {
                var oPayLoad = {
                    "email": sEmail,
                    "isActivated": sStatus
                };
                var oDataModel = this.getView().getModel();
                oDataModel.update(`/ContractorReassignmentRequests(${iId})/ReassignmentStatusId`, oPayLoad, {
                    success: function (data) {
                        var oTable = this.getView().byId("idWorkListTable1");
                        oTable.rebindTable();
                    }.bind(this),
                    error: function (data) {
                    }.bind(this),
                });
            },
        }
        );
    }
);
