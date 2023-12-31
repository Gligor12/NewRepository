sap.ui.define([
    "opensap/manageproducts/controller/BaseController",
    "sap/ui/core/routing/History"
    ], function(BaseController, History) {
    "use strict";
    return BaseController.extend("opensap.manageproducts.controller.Add", {
    /* =========================================================== */
    /* lifecycle methods */
    /* =========================================================== */
    /**
    * Called when the add controller is instantiated.
    * @public
    */
    onInit: function() {
    // Register to the add route matched
    this.getRouter().getRoute("add").attachPatternMatched(this._onRouteMatched, this);
    },
    /* =========================================================== */
    /* event handlers */
    /* =========================================================== */
    _onRouteMatched: function() {
        this.oContext=this.getModel().createEntry("/ProductSet" , {
            properties : {
                ProductID: "" + parseInt(Math.random() * 1000000000, 10),
                TypeCode: "PR",
                TaxTarifCode: 1,
                CurrencyCode: "EUR",
                MeasureUnit: "EA"

            },
            success : this._onAddProductSuccess.bind(this)
        });

        this.getView().setBindingContext(this.oContext);
    //here goes your logic which will be executed when the "add" route is hit
    //will be done within the next unit
    },

    onSave : function(){
        this.getModel().submitChanges();
    },

    _onAddProductSuccess : function(oProduct){
        this.getRouter().navTo("worklist");
    },
    /**
    * Event handler for navigating back.
    * It checks if there is a history entry. If yes, history.go(-1) will 
    happen.
    * If not, it will replace the current entry of the browser history 
    with the worklist route.
    * @public
    */
    onNavBack : function() {
    var oHistory = History.getInstance(),
    sPreviousHash = oHistory.getPreviousHash();
    if (sPreviousHash !== undefined) {
    // The history contains a previous entry
    history.go(-1);
    } else {
    // Otherwise we go backwards with a forward history
    var bReplace = true;
    this.getRouter().navTo("worklist", {}, bReplace);
    }
    
    }
    });
    });