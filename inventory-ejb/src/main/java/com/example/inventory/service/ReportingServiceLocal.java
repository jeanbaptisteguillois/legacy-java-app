package com.example.inventory.service;

import java.util.List;

import javax.ejb.Local;

import com.example.inventory.dto.LowStockAlertDto;
import com.example.inventory.dto.SalesSummaryDto;

/**
 * Local business interface for cross-service reporting and alerting.
 */
@Local
public interface ReportingServiceLocal {

    SalesSummaryDto getSalesSummary();

    List<LowStockAlertDto> getLowStockAlerts();

    void dispatchLowStockAlerts();
}
