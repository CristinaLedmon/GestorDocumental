<?php

namespace App\Http\Controllers\Api;

use App\Models\Example;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ExampleController extends Controller
{
    // Mostrar todos los registros
    public function index()
    {
        $examples = Example::all();
        return response()->json($examples);
    }

    // Mostrar formulario para crear (opcional si usas API)
    public function create()
    {
        return response()->json(['message' => 'Mostrar formulario de creación']);
    }

    // Guardar un nuevo registro
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'required|boolean',
        ]);

        $example = Example::create($request->all());

        return response()->json($example, 201);
    }

    // Mostrar un registro específico
    public function show(Example $example)
    {
        return response()->json($example);
    }

    // Mostrar formulario para editar (opcional si usas API)
    public function edit(Example $example)
    {
        return response()->json(['message' => 'Mostrar formulario de edición', 'data' => $example]);
    }

    // Actualizar un registro
    public function update(Request $request, Example $example)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'active' => 'required|boolean',
        ]);

        $example->update($request->all());

        return response()->json($example);
    }

    // Eliminar un registro
    public function destroy(Example $example)
    {
        $example->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
