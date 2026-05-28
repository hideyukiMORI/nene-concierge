<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class CreateUserHandler implements RequestHandlerInterface
{
    private const MIN_PASSWORD_LEN = 8;

    /** @var list<string> */
    private const VALID_ROLES = ['superadmin', 'owner', 'editor', 'viewer'];

    public function __construct(
        private CreateUserUseCase $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body   = JsonRequestBodyParser::parse($request);
        $errors = [];

        $email    = isset($body['email']) && is_string($body['email']) ? trim($body['email']) : '';
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
        $role     = isset($body['role']) && is_string($body['role']) ? trim($body['role']) : '';

        if ($email === '') {
            $errors[] = new ValidationError('email', 'Email is required.', 'required');
        } elseif (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors[] = new ValidationError('email', 'Email is not valid.', 'format');
        }

        if ($password === '') {
            $errors[] = new ValidationError('password', 'Password is required.', 'required');
        } elseif (strlen($password) < self::MIN_PASSWORD_LEN) {
            $errors[] = new ValidationError(
                'password',
                sprintf('Password must be at least %d characters.', self::MIN_PASSWORD_LEN),
                'too_short',
            );
        }

        if ($role === '') {
            $errors[] = new ValidationError('role', 'Role is required.', 'required');
        } elseif (!in_array($role, self::VALID_ROLES, true)) {
            $errors[] = new ValidationError(
                'role',
                'Role must be one of: ' . implode(', ', self::VALID_ROLES) . '.',
                'invalid',
            );
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $user = $this->useCase->execute(new CreateUserInput(
            email: $email,
            password: $password,
            role: $role,
        ));

        return $this->response->create(
            [
                'id'         => $user->id,
                'email'      => $user->email,
                'role'       => $user->role,
                'status'     => $user->status,
                'created_at' => $user->createdAt,
                'updated_at' => $user->updatedAt,
            ],
            201,
            ['Location' => '/api/v1/users/' . $user->id],
        );
    }
}
