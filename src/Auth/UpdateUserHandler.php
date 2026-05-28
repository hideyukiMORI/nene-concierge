<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class UpdateUserHandler implements RequestHandlerInterface
{
    private const MIN_PASSWORD_LEN = 8;

    /** @var list<string> */
    private const VALID_ROLES = ['superadmin', 'owner', 'editor', 'viewer'];

    /** @var list<string> */
    private const VALID_STATUSES = ['active', 'disabled'];

    public function __construct(
        private UpdateUserUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $id         = (int) ($parameters['id'] ?? 0);

        $body   = JsonRequestBodyParser::parse($request);
        $errors = [];

        $role     = isset($body['role'])     && is_string($body['role']) ? trim($body['role']) : null;
        $status   = isset($body['status'])   && is_string($body['status']) ? trim($body['status']) : null;
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : null;

        if ($role !== null && !in_array($role, self::VALID_ROLES, true)) {
            $errors[] = new ValidationError(
                'role',
                'Role must be one of: ' . implode(', ', self::VALID_ROLES) . '.',
                'invalid',
            );
        }

        if ($status !== null && !in_array($status, self::VALID_STATUSES, true)) {
            $errors[] = new ValidationError(
                'status',
                'Status must be one of: ' . implode(', ', self::VALID_STATUSES) . '.',
                'invalid',
            );
        }

        if ($password !== null && $password !== '' && strlen($password) < self::MIN_PASSWORD_LEN) {
            $errors[] = new ValidationError(
                'password',
                sprintf('Password must be at least %d characters.', self::MIN_PASSWORD_LEN),
                'too_short',
            );
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $user = $this->useCase->execute(new UpdateUserInput(
            id: $id,
            role: $role,
            status: $status,
            password: $password,
        ));

        return $this->response->create([
            'id'         => $user->id,
            'email'      => $user->email,
            'role'       => $user->role,
            'status'     => $user->status,
            'created_at' => $user->createdAt,
            'updated_at' => $user->updatedAt,
        ]);
    }
}
