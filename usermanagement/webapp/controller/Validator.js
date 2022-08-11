sap.ui.define(
    ["sap/ui/core/message/Message", "sap/ui/core/MessageType"],
    function (Message, MessageType) {
        "use strict";

        /**
         * @name        nl.qualiture.plunk.demo.utils.Validator
         *
         * @class
         * @classdesc   Validator class.<br/>
         *
         * @version     Oktober 2015
         * @author      Robin van het Hof
         */
        var Validator = function (mode) {
            this._isValid = true;
            this._isValidationPerformed = false;
            this._Release = true;
        };

        /**
         * Returns true _only_ when the form validation has been performed, and no validation errors were found
         * @memberof nl.qualiture.plunk.demo.utils.Validator
         *
         * @returns {boolean}
         */
        Validator.prototype.isValid = function () {
            return this._isValidationPerformed && this._isValid;
        };

        /**
         * Recursively validates the given oControl and any aggregations (i.e. child controls) it may have
         * @memberof nl.qualiture.plunk.demo.utils.Validator
         *
         * @param {(sap.ui.core.Control|sap.ui.layout.form.FormContainer|sap.ui.layout.form.FormElement)} oControl - The control or element to be validated.
         * @return {boolean} whether the oControl is valid or not.
         */
        Validator.prototype.validate = function (oControl, mParam) {
            this._isValid = true;
            if (mParam) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
            }

            if (oControl.hasOwnProperty("length") > 0) {
                for (var i in oControl) {
                    this._validate(oControl[i]);
                }
            } else {
                this._validate(oControl);
            }

            return this.isValid();
        };

        /**
         * Recursively validates the given oControl and any aggregations (i.e. child controls) it may have
         * @memberof nl.qualiture.plunk.demo.utils.Validator
         *
         * @param {(sap.ui.core.Control|sap.ui.layout.form.FormContainer|sap.ui.layout.form.FormElement)} oControl - The control or element to be validated.
         */
        Validator.prototype._validate = function (oControl) {
            var aPossibleAggregations = [
                "items",
                "content",
                "form",
                "formContainers",
                "formElements",
                "fields",
                "simpleForm",
                "rows",
                "cells",
                "sections",
                "subSections",
                "blocks",
            ],
                aControlAggregation = null,
                oControlBinding = null,
                oBindigPath,
                aValidateProperties = ["value", "selectedKey", "selectedKeys"], // yes, I want to validate Select and Text controls too
                isValidatedControl = false,
                oExternalValue,
                oInternalValue,
                i,
                j;

            // only validate controls and elements which have a 'visible' property
            if (
                oControl instanceof sap.ui.core.Control ||
                oControl instanceof sap.ui.layout.form.FormContainer ||
                oControl instanceof sap.ui.layout.form.FormElement ||
                oControl instanceof sap.ui.layout.form.SimpleForm
            ) {
                // only check visible controls (invisible controls make no sense checking)

                if (oControl.getVisible()) {
                    //

                    // check control for any properties worth validating
                    for (i = 0; i < aValidateProperties.length; i += 1) {
                        if (oControl.getBinding(aValidateProperties[i])) {
                            // check if a data type exists (which may have validation constraints)
                            if (oControl.getBinding(aValidateProperties[i]).getType()) {
                                // try validating the bound value

                                try {
                                    oControlBinding = oControl.getBinding(aValidateProperties[i]);
                                    oExternalValue = oControl.getProperty(aValidateProperties[i]);

                                    oInternalValue = oControlBinding
                                        .getType()
                                        .parseValue(oExternalValue, oControlBinding.sInternalType);

                                    //oControl.getProperty("editable") ||

                                    if (oControl.getProperty("enabled") && oControl.getProperty("editable")) {
                                        // Only editable control is validate000000000d0
                                        if (oControl.getProperty("required") === true) {
                                            // Validate manditory fields
                                            oControlBinding.getType().validateValue(oInternalValue);
                                        } else {
                                            if (oInternalValue !== "") {
                                                if (Array.isArray(oInternalValue)) {
                                                    if (oInternalValue.length > 0) {
                                                        oControlBinding.getType().validateValue(oInternalValue);
                                                    } else {
                                                        oControlBinding.getModel().setProperty(oControlBinding.getPath(), []);
                                                    }
                                                } else {
                                                    oControlBinding.getType().validateValue(oInternalValue);
                                                }


                                                //debugger;
                                            } // Non Manditory fields remove the value property
                                            else {
                                                var sPathB = oControlBinding.getPath();
                                                var oModel = oControlBinding.getModel();
                                                if (oControlBinding.getContext()) {
                                                    oModel.setProperty(oControlBinding.getContext().getPath()+"/"+oControlBinding.getPath(), "");
                                                } else {
                                                    oModel.setProperty(sPathB, "");
                                                }
                                                //oModel.setProperty(sPathB, "");
                                                //oModel.setProperty(sPathB, "");

                                            }
                                        }
                                    }
                                } catch (ex) {
                                    // catch any validation errors
                                    this._isValid = false;
                                    oControlBinding = oControl.getBinding(aValidateProperties[i]);
                                    var vaueStateText;
                                    if (
                                        oControl.getValueStateText() !== undefined &&
                                        oControl.getValueStateText() !== null &&
                                        oControl.getValueStateText() !== ""
                                    ) {
                                        vaueStateText = oControl.getValueStateText();
                                    } else {
                                        vaueStateText = ex.message;
                                    }

                                    sap.ui
                                        .getCore()
                                        .getMessageManager()
                                        .addMessages(
                                            new Message({
                                                message: vaueStateText,
                                                type: MessageType.Error,
                                                target:
                                                    (oControlBinding.getContext()
                                                        ? oControlBinding.getContext().getPath() + "/"
                                                        : "") + oControlBinding.getPath(),
                                                processor: oControl
                                                    .getBinding(aValidateProperties[i])
                                                    .getModel(),
                                            })
                                        );
                                }

                                isValidatedControl = true;
                            }
                        }
                    }

                    // if the control could not be validated, it may have aggregations
                    if (!isValidatedControl) {
                        for (i = 0; i < aPossibleAggregations.length; i += 1) {
                            aControlAggregation = oControl.getAggregation(
                                aPossibleAggregations[i]
                            );
                            if (aControlAggregation) {
                                // generally, aggregations are of type Array
                                // generally, aggregations are of type Array
                                if (aControlAggregation instanceof Array) {
                                    for (j = 0; j < aControlAggregation.length; j += 1) {
                                        if (aPossibleAggregations[i] === "rows") {
                                            var aCells = aControlAggregation[j].getCells();

                                            for (var x = 0; x < aCells.length; x++) {
                                                this._validate(aCells[x]);
                                            }
                                        } else {
                                            this._validate(aControlAggregation[j]);
                                        }
                                    }
                                }
                                // ...however, with sap.ui.layout.form.Form, it is a single object *sigh*
                                else {
                                    this._validate(aControlAggregation);
                                }
                            }
                        }
                    }
                }
            }
            this._isValidationPerformed = true;
        };
        return Validator;
    }
);
