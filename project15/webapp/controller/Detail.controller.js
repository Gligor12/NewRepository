sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, mobileLibrary , MessageToast , MessageBox) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("opensap.project1.controller.Detail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page is busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy : false,
                delay : 0,
                lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
            });

            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.getRouter().getRoute("addProject").attachPatternMatched(this._onObjectMatched, this);
            this.getRouter().getRoute("addSkill").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "detailView");

            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onSendEmailPress: function () {
            var oViewModel = this.getModel("detailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },

        
        /**
         * Updates the item count within the line item table's header
         * @param {object} oEvent an event containing the total number of items in the list
         * @private
         */
        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    //Display 'Line Items' instead of 'Line items (0)'
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                }
                oViewModel.setProperty("/lineItemListTitle", sTitle);
            }
        },

        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */

        /**
         * Binds the view to the object path and expands the aggregated line items.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {
            var sObjectId =  oEvent.getParameter("arguments").objectId;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getModel().metadataLoaded().then( function() {
                var sObjectPath = this.getModel().createKey("HeadSet", {
                    IdHead:  sObjectId
                });
                this._bindView("/" + sObjectPath);
            }.bind(this));

            /*this._resetTable("lineItemsList");
            this.byId("lineItemsList").removeSelections(true);
            this._resetTable("lineItemsSkillList");
            this.byId("lineItemsSkillList").removeSelections(true);*/
        },

        /**
         * Binds the view to the object path. Makes sure that detail view displays
         * a busy indicator while data for the corresponding element binding is loaded.
         * @function
         * @param {string} sObjectPath path to the object to be bound to the view.
         * @private
         */
        _bindView: function (sObjectPath) {
            // Set busy indicator during view binding
            var oViewModel = this.getModel("detailView");

            // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
            oViewModel.setProperty("/busy", false);

            this.getView().bindElement({
                path : sObjectPath,
                events: {
                    change : this._onBindingChange.bind(this),
                    dataRequested : function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

        _onBindingChange: function () {
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("detailObjectNotFound");
                // if object could not be found, the selection in the list
                // does not make sense anymore.
                this.getOwnerComponent().oListSelector.clearListListSelection();
                return;
            }

            var sPath = oElementBinding.getPath(),
                oResourceBundle = this.getResourceBundle(),
                oObject = oView.getModel().getObject(sPath),
                sObjectId = oObject.IdHead,
                sObjectName = oObject.Name1,
                oViewModel = this.getModel("detailView");

            this.getOwnerComponent().oListSelector.selectAListItem(sPath);

            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },

        _onMetadataLoaded: function () {
            // Store original busy indicator delay for the detail view
            var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                oViewModel = this.getModel("detailView"),
                oLineItemTable = this.byId("lineItemsList"),
                iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

            // Make sure busy indicator is displayed immediately when
            // detail view is displayed for the first time
            oViewModel.setProperty("/delay", 0);
            oViewModel.setProperty("/lineItemTableDelay", 0);

            oLineItemTable.attachEventOnce("updateFinished", function() {
                // Restore original busy indicator delay for line item table
                oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
            });

            // Binding the view will set it to not busy - so the view is always busy if it is not bound
            oViewModel.setProperty("/busy", true);
            // Restore original busy indicator delay for the detail view
            oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
        },

        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            // No item should be selected on list after detail page is closed
           
            this.getRouter().navTo("list");
        },

        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout",  this.getModel("appView").getProperty("/previousLayout"));
            }
        },

        onEditEmployee : function(){
            this._setEditEmployeeButtons(true);
            this._enableEditEmployee(true);
        },

        onSaveEdit : function(){
            var oResourceBundle=this.getResourceBundle();
            var sPath=this.byId("editEmployeeForm").getBindingContext().getPath();
            var idEmployee=this.byId("idEmployee").getValue();
            var firstName=this.byId("firstName").getValue();
            var lastName=this.byId("lastName").getValue();
            var street=this.byId("street").getValue();

            var data={
                IdHead : idEmployee,
                Name1 : firstName,
                Name2 : lastName,
                Street : street 
            }

            this.getModel().update(sPath , data , {
                success : function(){
                    MessageToast.show(oResourceBundle.getText("employeeEdotSuccess"));
                },
                error : function(){
                    MessageToast.show("Error while updating the data");
                }
            });

            this._setEditEmployeeButtons(false);
            this._enableEditEmployee(false);
        },

        onCancelEdit : function(){
            this._setEditEmployeeButtons(false);
            this._enableEditEmployee(false);

            this.getModel().resetChanges();
        },

        _setEditEmployeeButtons : function(bValue){
            this.byId("editEmployee").setVisible(!bValue);
            this.byId("saveEdit").setVisible(bValue);
            this.byId("cancelEdit").setVisible(bValue);
        },

        _enableEditEmployee(bValue){
            this.byId("firstName").setProperty("enabled" , bValue);
            this.byId("lastName").setProperty("enabled" , bValue);
            this.byId("street").setProperty("enabled" , bValue);
        },

        onAddProject : function(oEvent){
            var sObjectId= oEvent.getSource().getBindingContext().getProperty("IdHead");
            var sProjId="";
            var oRows=this.byId("lineItemsList").getItems();

            if(oRows.length <= 0){
                sProjId="0"
            }else {
                var oRowObj=oRows[oRows.length-1].getBindingContext().getObject();
                sProjId=oRowObj.IdProjects;
            }
            
            this.getRouter().navTo("addProject" , {
                objectId : sObjectId,
                projId : parseInt(sProjId)
            },true)
        },

        onAddSkill : function(oEvent){
            var sObjectId= oEvent.getSource().getBindingContext().getProperty("IdHead");

            this.getRouter().navTo("addSkill" , {
                objectId : sObjectId
            })
        },
        
        // Edit Employee Projects

        onEditProject : function(){
            var oTable=this.byId("lineItemsList");

            this._enableEditEmployee(false);
            this._setEditEmployeeButtons(false);
            oTable.setMode("SingleSelectLeft");
            this._showEditProjectButtons(true);
            this.getModel().resetChanges();

        },

        onSaveEditProject : function(){
            var oTable=this.byId("lineItemsList");
            var sPath=oTable.getSelectedItem().getBindingContext().getPath();
            var editData=oTable.getSelectedItem().getBindingContext().getObject();
            var oResourceBundle=this.getResourceBundle();

            this.getModel().update(sPath , editData ,{
                success : function(){
                    MessageToast.show(oResourceBundle.getText("editProjectSuccess"));
                }
            });
            oTable.setMode("None");
            this._resetTable("lineItemsList");
            this._showEditProjectButtons(false);
        },

        onCancelEditProject : function(){
            this.byId("lineItemsList").setMode("None");
            this._showEditProjectButtons(false);
            this._resetTable("lineItemsList");
            this.getModel().resetChanges();
        },

        onProjectSelectionChange :function(oEvent) {
            var selectedItem = oEvent.getParameter("listItem");
            var Cells=selectedItem.getCells();

            this._resetTable("lineItemsList");

            Cells.forEach( Item => {
                Item.setProperty("enabled" , true);
            });
            Cells[0].setProperty("enabled" , false);

            
        },

        _showEditProjectButtons : function(bValue){
            this.byId("editEmployee").setVisible(!bValue);
            this.byId("saveEditProject").setVisible(bValue);
            this.byId("cancelEditProject").setVisible(bValue);
            this.byId("deleteProject").setVisible(bValue);
        },

        _resetTable : function(sTableId){
            var oTableItems=this.byId(sTableId).getItems();

            oTableItems.forEach( Item => {
                var cells=Item.getCells();
                cells.forEach(cell => {
                    cell.setProperty("enabled" , false)
                });
            });
        },

        onDeleteProject : function(){
            var oTable=this.byId("lineItemsList");
            var oResourceBundle=this.getResourceBundle();
            var that=this;
            if(!oTable.getSelectedItem()){
                MessageToast.show(oResourceBundle.getText("noSelectedProject"));
            }else{
                var sPath = oTable.getSelectedItem().getBindingContext().getPath();
                MessageBox.confirm(oResourceBundle.getText("messageBoxConfirmProject") , {
                    title : oResourceBundle.getText("messageBoxDeleteProjectTitle"),
                    onClose : function(sAction){
                        if(sAction == "OK"){
                            that.getModel().remove(sPath , {
                                success : function(){
                                    MessageToast.show(oResourceBundle.getText("projectRemoveSuccess"));
                                    that._resetTable("lineItemsList");
                                    that._showEditProjectButtons(false);
                                    that.byId("lineItemsList").setMode("None");
                                }
                            });
                        }
                    }
                })
            }
        },

        //Edit Employee Skill

        onEditSkill : function(){
            var oTable=this.byId("lineItemsSkillList");
            
            this._enableEditEmployee(false);
            this._setEditEmployeeButtons(false);
            oTable.setMode("SingleSelectLeft");
            this._showEditSkillButtons(true);
            this.getModel().resetChanges();

        },

        onSaveEditSkill : function(){
            var oTable=this.byId("lineItemsSkillList");
            var sPath=oTable.getSelectedItem().getBindingContext().getPath();
            var editData=oTable.getSelectedItem().getBindingContext().getObject();
            var oResourceBundle=this.getResourceBundle();

            this.getModel().update(sPath , editData ,{
                success : function(){
                    MessageToast.show(oResourceBundle.getText("editSkillSuccess"));
                }
            });
            oTable.setMode("None");
            this._resetTable("lineItemsSkillList");
            this._showEditSkillButtons(false);
        },

        onCancelEditSkill : function(){
                this.byId("lineItemsSkillList").setMode("None");
                this._showEditSkillButtons(false);
                this._resetTable("lineItemsSkillList");
                this.getModel().resetChanges();

        },

        onSkillSelectionChange : function(oEvent){
            var selectedItem = oEvent.getParameter("listItem");
            var Cells=selectedItem.getCells();

            this._resetTable("lineItemsSkillList");

            Cells.forEach( Item => {
                Item.setProperty("enabled" , true);
            });
            Cells[0].setProperty("enabled" , false);
        },

        onDeleteSkill : function(){
            var oTable=this.byId("lineItemsSkillList");
            var oResourceBundle=this.getResourceBundle();
            var that=this;
            if(!oTable.getSelectedItem()){
                MessageToast.show(oResourceBundle.getText("noSelectedSkill"));
            }else{
                var sPath = oTable.getSelectedItem().getBindingContext().getPath();
                MessageBox.confirm( oResourceBundle.getText("messageBoxConfirmSkill") , {
                    title : oResourceBundle.getText("messageBoxDeleteSkillTitle"),
                    onClose : function(sAction){
                        if(sAction == "OK"){
                            that.getModel().remove(sPath , {
                                success : function(){
                                    MessageToast.show(oResourceBundle.getText("skillRemoveSuccess"));
                                    that._resetTable("lineItemsSkillList");
                                    that._showEditSkillButtons(false);
                                    that.byId("lineItemsSkillList").setMode("None");
                                }
                            });
                        }
                    }
                })
            }
        },

        _showEditSkillButtons : function(bValue){
            this.byId("editEmployee").setVisible(!bValue);
            this.byId("saveEditSkill").setVisible(bValue);
            this.byId("cancelEditSkill").setVisible(bValue);
            this.byId("deleteSkill").setVisible(bValue);
        },

        onFilterSelect : function(){
            this.byId("lineItemsSkillList").setMode("None");
            this.byId("lineItemsList").setMode("None");
            this._resetTable("lineItemsSkillList");
            this._resetTable("lineItemsList");
            this._showEditProjectButtons(false);
            this._showEditSkillButtons(false);
            this.getModel().resetChanges();
        }

    });

});