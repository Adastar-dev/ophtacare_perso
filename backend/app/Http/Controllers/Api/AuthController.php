<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect.'], 401);
        }

        $token = $user->createToken($request->userAgent() ?: 'appareil')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /** Informations professionnelles (en-tête des ordonnances). */
    public function updateProfil(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'titre' => 'sometimes|nullable|string|max:20',
            'specialite' => 'sometimes|nullable|string|max:255',
            'telephone' => 'sometimes|nullable|string|max:50',
            'numero_ordre' => 'sometimes|nullable|string|max:100',
        ]);

        $user->update($validated);

        return response()->json(['message' => 'Profil mis à jour.', 'user' => $user->fresh()]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => ['current_password' => ['Le mot de passe actuel est incorrect.']],
            ], 422);
        }

        $user->update(['password' => $request->password]);

        // Déconnecte les autres appareils, garde la session actuelle
        $currentId = $user->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentId)->delete();

        return response()->json(['message' => 'Mot de passe modifié. Les autres appareils ont été déconnectés.']);
    }
}
