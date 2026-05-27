<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * Minimal PSR-18 HTTP client backed by PHP's cURL extension.
 *
 * This implementation is intentionally simple: it handles the common
 * REST/webhook use-cases (JSON payloads, simple headers) that the
 * Action adapters require, without pulling in a full HTTP library.
 */
final readonly class CurlHttpClient implements ClientInterface
{
    public function sendRequest(RequestInterface $request): ResponseInterface
    {
        $ch = curl_init();

        if ($ch === false) {
            throw new CurlNetworkException('Failed to initialise cURL handle.', $request);
        }

        // Build headers list for cURL
        $headers = [];

        foreach ($request->getHeaders() as $name => $values) {
            $headers[] = $name . ': ' . implode(', ', $values);
        }

        $method = strtoupper($request->getMethod());
        $body   = (string) $request->getBody();
        $uri    = (string) $request->getUri();

        if ($uri === '') {
            throw new CurlNetworkException('Request URI must not be empty.', $request);
        }

        if ($method === '') {
            throw new CurlNetworkException('Request method must not be empty.', $request);
        }

        curl_setopt($ch, CURLOPT_URL, $uri);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HEADER, true);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        } elseif ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

            if ($body !== '') {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            }
        }

        $raw = curl_exec($ch);

        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);

            throw new CurlNetworkException($error !== '' ? $error : 'Unknown cURL error.', $request);
        }

        $headerSize   = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $statusCode   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $rawHeaders  = substr((string) $raw, 0, $headerSize);
        $rawBody     = substr((string) $raw, $headerSize);
        $parsedHeaders = $this->parseHeaders($rawHeaders);

        return new CurlHttpResponse($statusCode, $parsedHeaders, $rawBody, $request->getProtocolVersion());
    }

    /**
     * @return array<string, list<string>>
     */
    private function parseHeaders(string $raw): array
    {
        /** @var array<string, list<string>> $headers */
        $headers = [];
        $lines   = explode("\r\n", trim($raw));

        foreach (array_slice($lines, 1) as $line) {
            $pos = strpos($line, ':');

            if ($pos === false) {
                continue;
            }

            $name  = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));

            if ($name === '') {
                continue;
            }

            $existing   = $headers[$name] ?? [];
            $existing[] = $value;
            $headers[$name] = $existing;
        }

        return $headers;
    }
}
