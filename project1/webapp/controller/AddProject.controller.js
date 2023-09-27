sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast"
], function(BaseController , MessageToast) {
    'use strict';

    return BaseController.extend("opensap.project1.controller.AddProject" , {
        sObjectId : "",
        onInit : function(){
            this.getRouter().getRoute("addProject").attachPatternMatched(this._onAddProjectMatched, this);
        },

        _onAddProjectMatched : function(oEvent){
            this.sObjectId=oEvent.getParameter("arguments").objectId;          
            var sIdProj=oEvent.getParameter("arguments").projId;
            this.oContext=this.getModel().createEntry("/ProjectsSet" , {
                properties : {
                    IdHead : this.sObjectId,
                    IdProjects : "" + (parseInt(sIdProj)+1),
                    Topic : "",
                    Projname : "",
                    Periodoftime : "",
                    Customer : "",
                    Status : ""
                },
                success : this._onAddProjectSuccess.bind(this)
    
            })
            this.getView().setBindingContext(this.oContext);
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
        },

        _onAddProjectSuccess : function(){
            var oResourceBundle=this.getResourceBundle();
            MessageToast.show(oResourceBundle.getText("addProjectSuccess") , {
                closeOnBrowserNavigation : false
            });

            this.getRouter().navTo("object" , {
                objectId : this.sObjectId
            })
        },

        onSaveProject : function(){
            if(this._formValidation() == false){
                return this._formValidation();
            }else{
                this.getModel().submitChanges();
            }
        },

        onCancel : function(){
            this.getModel().deleteCreatedEntry(this.oContext);

            this.getRouter().navTo("object" , {
                objectId : this.sObjectId
            })
        },

        _formValidation : function(){
            var oResourceBundle=this.getResourceBundle();
            var projectName=this.byId("projName").getValue();
            var customer=this.byId("customer").getValue();
            var topic=this.byId("topic").getValue();
            var status=this.byId("status").getValue();
            var periodOfTime=this.byId("periodOfTime").getValue();
            var validation=true;

            if(projectName.trim() == "" || customer.trim() == "" || topic.trim() == "" || status.trim() == "" || periodOfTime.trim() == ""){
                MessageToast.show(oResourceBundle.getText("emptyInput"));
                validation=false;
            }

            return validation;
        }

    });
    
});