<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class CreateCredentialHandler implements RequestHandlerInterface
{
    public function __construct(
        private ActionCredentialRepositoryInterface $credentials,
        private JsonResponseFactory                 $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId  = (int) $request->getAttribute('nene2.org.id', 0);
        $body   = JsonRequestBodyParser::parse($request);
        $errors = [];

        $name    = trim((string) ($body['name'] ?? ''));
        $adapter = trim((string) ($body['adapter'] ?? ''));

        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        if ($adapter === '') {
            $errors[] = new ValidationError('adapter', 'Adapter is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        /** @var array<string, mixed> $config */
        $config = (array) ($body['config'] ?? []);

        $id = $this->credentials->save(new ActionCredential(
            organizationId: $orgId,
            name:           $name,
            adapter:        $adapter,
            config:         $config,
        ));

        return $this->response->create(
            ['id' => $id],
            201,
            ['Location' => '/api/v1/action-credentials/' . $id],
        );
    }
}
