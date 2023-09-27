sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast"
], function(BaseController , MessageToast) {
    'use strict';
    
    return BaseController.extend("opensap.project1.controller.AddEmployee" , {

        onInit : function(){
            this.getRouter().getRoute("addEmployee").attachPatternMatched(this._onAddEmployeeMatched, this);
        },

        _onAddEmployeeMatched : function(){
            this.oContext = this.getView().getModel().createEntry("/HeadSet", {
                properties: {
                    IdHead: "",
                    Name1: "",
                    Name2: "",
                    Street: "",
                },
                success: this._onCreateSuccess.bind(this)
            });
            this.getView().setBindingContext(this.oContext); 
        },
        _onCreateSuccess : function(){
            var oResourceBundle=this.getResourceBundle();
            MessageToast.show(oResourceBundle.getText("addEmployeeSuccess"),{
                closeOnBrowserNavigation:false });
            this.getRouter().navTo("list");
        },

        onSave:function(){
            if(this._formValidation() == false){
                this._formValidation();
            }else{
            this.getModel().submitChanges()
            }
        },
        onCancel : function(){
            this.getModel().deleteCreatedEntry(this.oContext);
            this.getRouter().navTo("list");
        },

        _formValidation(){
            var firstName=this.byId("firstName").getValue();
            var lastName=this.byId("lastName").getValue();
            var street=this.byId("street").getValue();
            var validation=true;

            if(firstName.trim() == "" || lastName.trim() == "" || street.trim() == ""){
                MessageToast.show("Fill out required fields.");
                validation=false
            }

            return validation

        }


    })
});