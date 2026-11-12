import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import type { Customer } from "../types/Customer";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_URL = `${API_BASE}/cars`;

// Inputs controlados recebem strings; só `imported` é booleano (checkbox).
type CarFormData = {
  brand: string;
  model: string;
  color: string;
  year_manufacture: string;
  imported: boolean;
  plates: string;
  selling_date: string;
  selling_price: string;
  customer_id: string;
};

const formDefaults: CarFormData = {
  brand: "",
  model: "",
  color: "",
  year_manufacture: "",
  imported: false,
  plates: "",
  selling_date: "",
  selling_price: "",
  customer_id: "",
};

// Lista estática de cores para a caixa de combinação
const colors = [
  { value: "Branco", label: "Branco" },
  { value: "Preto", label: "Preto" },
  { value: "Prata", label: "Prata" },
  { value: "Cinza", label: "Cinza" },
  { value: "Vermelho", label: "Vermelho" },
  { value: "Azul", label: "Azul" },
  { value: "Verde", label: "Verde" },
  { value: "Amarelo", label: "Amarelo" },
];

function getCatchMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido.";
}

async function getErrorMessage(response: Response) {
  const error = await response.json().catch(() => null);
  return error?.message || `A requisição falhou (HTTP ${response.status}).`;
}

export function CarsForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [car, setCar] = useState<CarFormData>({ ...formDefaults });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [formModified, setFormModified] = useState(false);

  async function loadData(active: boolean) {
    setLoading(true);
    setLoadFailed(false);
    setFormModified(false);
    setCar({ ...formDefaults });

    try {
      // Lista dinâmica: busca todos os clientes para a caixa de combinação.
      // Fica ANTES do `if (isNew) return`, para carregar também no cadastro novo.
      const customersResponse = await fetch(`${API_BASE}/customers`);

      if (!customersResponse.ok) {
        throw new Error(await getErrorMessage(customersResponse));
      }

      const customersData: Customer[] = await customersResponse.json();

      if (active) setCustomers(customersData);

      // Cadastro de veículo novo: não há nada mais para buscar
      if (isNew) return;

      const response = await fetch(`${API_URL}/${id}`);

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = await response.json();

      if (active) {
        setCar({
          brand: result.brand ?? "",
          model: result.model ?? "",
          color: result.color ?? "",
          year_manufacture: result.year_manufacture?.toString() ?? "",
          imported: result.imported ?? false,
          plates: result.plates ?? "",
          selling_date: result.selling_date?.slice(0, 10) ?? "",
          selling_price: result.selling_price?.toString() ?? "",
          customer_id: result.customer_id?.toString() ?? "",
        });
      }
    } catch (error) {
      if (active) {
        setLoadFailed(true);
        window.alert(
          `Não foi possível carregar os dados. ${getCatchMessage(error)}`,
        );
      }
    } finally {
      if (active) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    loadData(active);

    return () => {
      active = false;
    };
  }, [id, isNew]);

  // Trata inputs de texto, selects e o checkbox (que usa `checked`, não `value`)
  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const target = event.target;
    const { name } = target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setCar((previous) => ({ ...previous, [name]: value }));
    setFormModified(true);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || loadFailed) return;

    setLoading(true);

    try {
      const payload = {
        ...car,
        year_manufacture: Number(car.year_manufacture),
        selling_date: car.selling_date
          ? `${car.selling_date}T00:00:00.000Z`
          : null,
        selling_price: car.selling_price ? Number(car.selling_price) : null,
        customer_id: car.customer_id ? Number(car.customer_id) : null,
      };

      const method = isNew ? "POST" : "PUT";
      const uri = isNew ? API_URL : `${API_URL}/${id}`;

      const response = await fetch(uri, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setFormModified(false);
      window.alert("Veículo salvo com sucesso.");
      navigate("/cars");
    } catch (error) {
      window.alert(
        `Não foi possível salvar o veículo. ${getCatchMessage(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBackButtonClick() {
    if (
      formModified &&
      !window.confirm("Há informações não salvas. Deseja realmente sair?")
    ) {
      return;
    }

    navigate("/cars");
  }

  return (
    <section className="container py-4">
      <h1 className="mb-4">
        {isNew ? "Cadastrar novo veículo" : `Editar veículo ${id}`}
      </h1>

      {loading && <p role="status">Aguarde, processando...</p>}

      {loadFailed && (
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados. Volte à listagem e tente
          novamente.
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={loading || loadFailed}>
          <legend className="visually-hidden">Dados do veículo</legend>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="brand" className="form-label">
                Marca
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                className="form-control"
                required
                autoFocus
                value={car.brand}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="model" className="form-label">
                Modelo
              </label>
              <input
                id="model"
                name="model"
                type="text"
                className="form-control"
                required
                value={car.model}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="color" className="form-label">
                Cor
              </label>
              <select
                id="color"
                name="color"
                className="form-select"
                required
                value={car.color}
                onChange={handleFieldChange}
              >
                <option value="">Selecione...</option>
                {colors.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="year_manufacture" className="form-label">
                Ano de fabricação
              </label>
              <input
                id="year_manufacture"
                name="year_manufacture"
                type="number"
                className="form-control"
                required
                value={car.year_manufacture}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="plates" className="form-label">
                Placa
              </label>
              <input
                id="plates"
                name="plates"
                type="text"
                className="form-control"
                required
                value={car.plates}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  id="imported"
                  name="imported"
                  type="checkbox"
                  className="form-check-input"
                  checked={car.imported}
                  onChange={handleFieldChange}
                />
                <label htmlFor="imported" className="form-check-label">
                  Importado
                </label>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="selling_date" className="form-label">
                Data da venda
              </label>
              <input
                id="selling_date"
                name="selling_date"
                type="date"
                className="form-control"
                value={car.selling_date}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="selling_price" className="form-label">
                Preço de venda
              </label>
              <input
                id="selling_price"
                name="selling_price"
                type="number"
                step="0.01"
                className="form-control"
                value={car.selling_price}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="customer_id" className="form-label">
                Proprietário
              </label>
              <select
                id="customer_id"
                name="customer_id"
                className="form-select"
                value={car.customer_id}
                onChange={handleFieldChange}
              >
                <option value="">Selecione...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-4">
            Salvar
          </button>
        </fieldset>

        <button
          type="button"
          className="btn btn-outline-secondary mt-3"
          disabled={loading}
          onClick={handleBackButtonClick}
        >
          Voltar
        </button>
      </form>
    </section>
  );
}