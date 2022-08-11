sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        fmtLowerCase: function (mParam) {
            if (!mParam) {
                return
            }
            var sStatus = "";

            if (mParam.split("_").length > 1) {
                var mArray = mParam.split("_");

            } else {
                var mArray = mParam.split(" ");

            }
            for (var x of mArray) {
                var a = x.toLowerCase() + " ";
                var b = a[0].toUpperCase() + a.slice(1);

                sStatus += b;
            }
            return sStatus;
        },
        fmtCheckNull: function (mParam1) {
            if (!mParam1) {
                return "NA"
            }
            return mParam1;
        },
        fmtGenerateImageUrl: function (mMetadata) {
            // mMetadata (string) is required from the odata responce "__metadata"
            if (mMetadata) {
                if (mMetadata.media_src) {
                    return "https://".concat(
                        location.host,
                        "/KNPL_PAINTER_API",
                        new URL(mMetadata.media_src).pathname
                    );
                }
            }

            return "";

        },
        fmtStatusColorChange: function (mParam) {
            if (mParam === "Activated") {
                return "Success";
            }
            return "Error";
        },
        fmttext: function (mParam) {
            if (mParam === 1) {
                return "Activated";
            }
            if (mParam === 0) {
                return "Deactivated";
            }

            
        },
        getDateTime:function(mParam){
            if(!mParam)
            {
                return "---";
            }
     var date = mParam.split(".")[0],
     sdate = date.split(" ");
     var  sMeridian =  date.split(" ")[1].split(":")[0]  >= 12 ? "PM":"AM";
     date = `${sdate[0]}, ${sdate[1]} ${sMeridian}`
     return date;
        }
    };

});
