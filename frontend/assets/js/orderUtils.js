window.OrderUtils = {
    formatOrderDate: function (dateString, showTime = false) {
        if (!dateString) {
            return "-";
        }

        let parts = dateString.split(" ");
        let datePart = parts[0];
        let timePart = parts.length > 1 ? parts[1] : "";

        let dateParts = datePart.split("-");

        if (dateParts.length !== 3) {
            return dateString;
        }

        let formattedDate = dateParts[2] + "." + dateParts[1] + "." + dateParts[0];

        if (showTime && timePart) {
            let timeParts = timePart.split(":");
            formattedDate += " " + timeParts[0] + ":" + timeParts[1];
        }

        return formattedDate;
    },

    getStatusInfo: function (status) {
        switch (status) {
            case "pending":
                return {
                    text: "Pending",
                    badgeClass: "bg-warning"
                };

            case "processing":
                return {
                    text: "Processing",
                    badgeClass: "bg-info"
                };

            case "shipped":
                return {
                    text: "Shipped",
                    badgeClass: "bg-primary"
                };

            case "delivered":
                return {
                    text: "Delivered",
                    badgeClass: "bg-success"
                };

            case "cancelled":
                return {
                    text: "Cancelled",
                    badgeClass: "bg-danger"
                };

            case "refunded":
                return {
                    text: "Refunded",
                    badgeClass: "bg-secondary"
                };

            default:
                return {
                    text: status || "Unknown",
                    badgeClass: "bg-dark"
                };
        }
    },

    renderOrderStatusBadge: function (status) {
        let statusInfo = this.getStatusInfo(status);

        return `
            <span class="badge ${statusInfo.badgeClass}">
                ${statusInfo.text}
            </span>
        `;
    }
};