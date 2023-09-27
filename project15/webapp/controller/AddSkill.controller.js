sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast"
], function(BaseController,MessageToast) {
    "use strict";

    return BaseController.extend("opensap.project1.controller.AddSkill" , {

        onInit : function(){
            this.getRouter().getRoute("addSkill").attachPatternMatched(this._onAddSkillMatched, this);
        },

        _onAddSkillMatched : function(oEvent){
            var sObjectId=oEvent.getParameter("arguments").objectId;
            this.oContext=this.getModel().createEntry("/SkillsSet" , {
                properties : {
                    IdHead : sObjectId,
                    IdSkills : "",
                    Topic: "",
                    Name : "",
                    Edate : "",
                    Dlevel : ""
                },
                success : this._onAddSkillSuccess.bind(this)
            });

            this.getView().setBindingContext(this.oContext);

            this.getView().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
        },

        _onAddSkillSuccess : function(oContext){
            var oResourceBundle=this.getResourceBundle();

            MessageToast.show( oResourceBundle.getText("addSkillSuccess") , {
                closeOnBrowserNavigation:false
            });

            this.getRouter().navTo("object",{
                objectId : oContext.IdHead
            });

        },

        onSaveSkill : function(){
            if(this._formValidation() == false){
                return this._formValidation();
            }else {
                this.getModel().submitChanges(); 
            }
        },

        onCancel: function(){
            var sObjectId=this.getView().getBindingContext().getProperty("IdHead");
            this.getModel().deleteCreatedEntry();

            this.getRouter().navTo("object" , {
                objectId : sObjectId
            })
        },

        _formValidation : function(){
            var oResourceBundle=this.getResourceBundle();
            var skillName=this.byId("skillName").getValue();
            var date=this.byId("date").getValue();
            var topic=this.byId("topic").getValue();
            var level=this.byId("skillLevel").getValue();
            var validation=true;

            if(skillName.trim() == "" || date.trim() == "" || topic.trim() == "" || level.trim() == ""){
                MessageToast.show(oResourceBundle.getText("emptyInput"));
                validation=false;
            }

            return validation;
        }

    });
    
});