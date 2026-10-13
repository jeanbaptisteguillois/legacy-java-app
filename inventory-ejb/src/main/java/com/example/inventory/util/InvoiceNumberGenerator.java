package com.example.inventory.util;

import java.util.Date;

import org.apache.commons.lang3.time.DateFormatUtils;
import org.apache.commons.lang3.RandomStringUtils;

/**
 * Generates human-readable invoice numbers.
 *
 * <p>Uses Apache Commons Lang 3 ({@code commons-lang3}).</p>
 */
public final class InvoiceNumberGenerator {

    private static final String DATE_PATTERN = "yyyyMMdd";

    private InvoiceNumberGenerator() {
    }

    public static String generate(Date issueDate) {
        String datePart = DateFormatUtils.format(issueDate, DATE_PATTERN);
        String randomPart = RandomStringUtils.secure().nextNumeric(6);
        return "INV-" + datePart + "-" + randomPart;
    }
}
