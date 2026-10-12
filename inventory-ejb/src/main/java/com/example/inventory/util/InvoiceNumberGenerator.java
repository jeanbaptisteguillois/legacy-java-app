package com.example.inventory.util;

import java.util.Date;

import org.apache.commons.lang.time.DateFormatUtils;
import org.apache.commons.lang.RandomStringUtils;

/**
 * Generates human-readable invoice numbers.
 *
 * <p>Uses Apache Commons Lang 2.x ({@code commons-lang}), which has been
 * superseded by {@code commons-lang3}. Retained deliberately in this sample
 * application for modernization-tooling detection purposes.</p>
 */
public final class InvoiceNumberGenerator {

    private static final String DATE_PATTERN = "yyyyMMdd";

    private InvoiceNumberGenerator() {
    }

    public static String generate(Date issueDate) {
        String datePart = DateFormatUtils.format(issueDate, DATE_PATTERN);
        String randomPart = RandomStringUtils.randomNumeric(6);
        return "INV-" + datePart + "-" + randomPart;
    }
}
